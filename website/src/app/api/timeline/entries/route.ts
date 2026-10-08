// ============================================================
// GET /api/timeline/entries?patientId=AS-XXXX
// Fetches health timeline entries from DynamoDB
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "crypto";
import { putAuditLog } from "../../../../lib/aws/dynamodb";

const region = process.env.NEXT_PUBLIC_AWS_REGION || process.env.APP_AWS_REGION || "ap-south-1";

const creds =
    process.env.APP_AWS_ACCESS_KEY_ID && process.env.APP_AWS_SECRET_ACCESS_KEY
        ? {
            credentials: {
                accessKeyId: process.env.APP_AWS_ACCESS_KEY_ID,
                secretAccessKey: process.env.APP_AWS_SECRET_ACCESS_KEY,
            },
        }
        : {};

const client = new DynamoDBClient({ region, ...creds });
const db = DynamoDBDocumentClient.from(client);

const TABLE = process.env.DYNAMODB_HEALTH_RECORDS_TABLE || "arogyasutra-health-records";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const patientId = searchParams.get("patientId");
    // Optional actor context passed by the client (doctor viewing patient records)
    const viewerType = searchParams.get("viewerType") as "PATIENT" | "DOCTOR" | null;
    const viewerId = searchParams.get("viewerId");
    const viewerName = searchParams.get("viewerName");

    if (!patientId) {
        return NextResponse.json({ error: "Missing patientId" }, { status: 400 });
    }

    try {
        const result = await db.send(
            new QueryCommand({
                TableName: TABLE,
                KeyConditionExpression: "patientId = :pid",
                ExpressionAttributeValues: { ":pid": patientId },
                ScanIndexForward: false, // newest first
                Limit: 50,
            })
        );

        let entries: any[] = (result.Items ?? []).map((item) => ({
            entryId: item.entryId,
            patientId: item.patientId,
            title: item.title,
            documentType: item.documentType,
            statusFlags: item.statusFlags ?? [],
            sourceInstitution: item.sourceInstitution,
            doctorName: item.doctorName,
            date: item.date,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
            encryptedBlobKey: item.encryptedBlobKey ?? "",
            fhirResourceIds: item.fhirResourceIds ?? [],
            confidenceScore: item.confidenceScore,
            addedBy: item.addedBy,
            metadata: item.metadata ?? {},
        }));

        // If no records in DynamoDB, fallback to full clinical seed entries for demo
        if (entries.length === 0) {
            const { SEED_TIMELINE_ENTRIES } = await import("../../../../lib/data/seedData");
            entries = SEED_TIMELINE_ENTRIES;
        }

        // Write audit log non-blocking (failure must not block the response)
        const actorType = viewerType === "DOCTOR" ? "DOCTOR" : "PATIENT";
        const actorId = viewerId ?? patientId;
        const actorName = viewerName ?? (actorType === "PATIENT" ? "Patient" : "Doctor");
        const auditAction = actorType === "DOCTOR" ? "DOCTOR_VIEW_TIMELINE" : "TIMELINE_VIEW";
        putAuditLog({
            logId: randomUUID(),
            patientId,
            action: auditAction,
            performedBy: { type: actorType, userId: actorId, name: actorName },
            timestamp: new Date().toISOString(),
            userAgent: req.headers.get("user-agent") ?? undefined,
            details: { entryCount: String(entries.length) },
        }).catch((e) => console.error("[audit] TIMELINE_VIEW write failed:", e));

        return NextResponse.json({
            entries,
            totalCount: entries.length,
            hasMore: false,
        });
    } catch (err) {
        const msg = (err as Error).message ?? "Unknown error";
        console.warn("[/api/timeline/entries] DynamoDB fallback to seed data:", msg);
        try {
            const { SEED_TIMELINE_ENTRIES } = await import("../../../../lib/data/seedData");
            return NextResponse.json({
                entries: SEED_TIMELINE_ENTRIES,
                totalCount: SEED_TIMELINE_ENTRIES.length,
                hasMore: false,
            });
        } catch {
            return NextResponse.json({ entries: [], totalCount: 0, hasMore: false });
        }
    }
}
