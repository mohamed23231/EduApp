# Parent API Contract Verification Checklist

**Purpose:** This checklist verifies that backend endpoints used by parent features return the expected response shapes and support localization. All items must be confirmed by the Backend Tech Lead before parent feature implementation (tasks 5+) begins.

**Requirements:** 16.1, 16.2, 16.3, 16.4, 16.5

---

## Endpoint-to-Field Matrix

### 1. Get Students List

| Field | Value |
|-------|-------|
| **Endpoint** | `/api/v1/parents/students` |
| **HTTP Method** | GET |
| **Request Parameters** | None (auth token in Authorization header) |
| **Response Fields** | `data: [{ id, fullName, avatarUrl?, grade?, schoolName? }]` |
| **Error Codes** | `UNAUTHORIZED`, `FORBIDDEN`, `INTERNAL_SERVER_ERROR` |
| **Localization (X-Language)** | Supports `X-Language: en` and `X-Language: ar` for error messages |
| **Status** | ☐ Confirmed / ☐ Pending |
| **Owner** | Backend Tech Lead |
| **Date** | — |
| **Notes** | Returns array of linked students for authenticated parent. Empty array if no students linked. |

---

### 2. Link Student via Access Code

| Field | Value |
|-------|-------|
| **Endpoint** | `/api/v1/parents/link-student` |
| **HTTP Method** | POST |
| **Request Parameters** | `{ accessCode: string }` (in request body) |
| **Response Fields** | `data: { id, fullName, avatarUrl?, grade?, schoolName? }` (linked student object) |
| **Error Codes** | `INVALID_ACCESS_CODE`, `STUDENT_ALREADY_LINKED`, `ACCESS_CODE_EXPIRED`, `UNAUTHORIZED`, `FORBIDDEN`, `INTERNAL_SERVER_ERROR` |
| **Localization (X-Language)** | Supports `X-Language: en` and `X-Language: ar` for error messages |
| **Status** | ☐ Confirmed / ☐ Pending |
| **Owner** | Backend Tech Lead |
| **Date** | — |
| **Notes** | Accepts access code and returns the newly linked student object. Error messages must be localized per X-Language header. |

---

### 3. Get Student Details

| Field | Value |
|-------|-------|
| **Endpoint** | `/api/v1/parents/students/:studentId` |
| **HTTP Method** | GET |
| **Request Parameters** | `studentId` (path parameter) |
| **Response Fields** | `data: { id, fullName, avatarUrl?, grade?, schoolName?, email?, phone?, enrollmentDate? }` |
| **Error Codes** | `STUDENT_NOT_FOUND`, `UNAUTHORIZED`, `FORBIDDEN`, `INTERNAL_SERVER_ERROR` |
| **Localization (X-Language)** | Supports `X-Language: en` and `X-Language: ar` for error messages |
| **Status** | ☐ Confirmed / ☐ Pending |
| **Owner** | Backend Tech Lead |
| **Date** | — |
| **Notes** | Returns detailed profile information for a single linked student. Must verify student belongs to authenticated parent. |

---

### 4. Get Student Attendance

| Field | Value |
|-------|-------|
| **Endpoint** | `/api/v1/parents/students/:studentId/attendance` |
| **HTTP Method** | GET |
| **Request Parameters** | `studentId` (path parameter) |
| **Response Fields** | `data: [{ sessionDate, sessionName, status }]` where `status` is one of: `PRESENT`, `ABSENT`, `EXCUSED`, `NOT_MARKED` |
| **Error Codes** | `STUDENT_NOT_FOUND`, `UNAUTHORIZED`, `FORBIDDEN`, `INTERNAL_SERVER_ERROR` |
| **Localization (X-Language)** | Supports `X-Language: en` and `X-Language: ar` for error messages |
| **Status** | ☐ Confirmed / ☐ Pending |
| **Owner** | Backend Tech Lead |
| **Date** | — |
| **Notes** | Returns array of attendance records for the specified student. Empty array if no records available. Must verify student belongs to authenticated parent. |

---

## Standard Response Envelope

All endpoints MUST return responses in the following standard envelope format:

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { /* endpoint-specific data */ },
  "code": "SUCCESS",
  "statusCode": 200
}
```

### Error Response
```json
{
  "success": false,
  "message": "Localized error message from backend",
  "data": null,
  "code": "ERROR_CODE",
  "statusCode": 400 /* or appropriate HTTP status */
}
```

**Requirements:**
- ☐ All endpoints return `success: boolean` field
- ☐ All endpoints return `message: string` field (localized per X-Language header)
- ☐ All endpoints return `data: T | null` field (T is endpoint-specific, null on error)
- ☐ All endpoints return `code: string` field (error code on failure)
- ☐ All endpoints return `statusCode: number` field (HTTP status code)

---

## Localization Requirements

All parent API endpoints MUST support the `X-Language` header for localized error messages:

- ☐ Endpoint accepts `X-Language: en` header → returns English error messages
- ☐ Endpoint accepts `X-Language: ar` header → returns Arabic error messages
- ☐ Endpoint defaults to English if `X-Language` header is missing
- ☐ Error messages are localized by the backend Localization_Service
- ☐ Error messages are returned in the `message` field of the error envelope

---

## Sign-Off

**Backend Tech Lead Verification:**

This checklist confirms that all parent API endpoints have been reviewed and verified to meet the contract requirements above. The backend team commits to maintaining these contracts throughout the parent feature implementation phase.

| Item | Status |
|------|--------|
| All endpoints return standard envelope format | ☐ Yes / ☐ No |
| All error codes documented and stable | ☐ Yes / ☐ No |
| All endpoints support X-Language header | ☐ Yes / ☐ No |
| Response field shapes match design document | ☐ Yes / ☐ No |
| No breaking changes planned during MVP phase | ☐ Yes / ☐ No |

**Backend Tech Lead Name:** ___________________________

**Signature:** ___________________________

**Date:** ___________________________

---

## Notes for Mobile Team

- This checklist must be signed off by the Backend Tech Lead before parent feature implementation begins (task 5+).
- If any endpoint or error code changes during development, the Backend Tech Lead MUST notify the mobile team and update this checklist.
- The mobile team will implement services and hooks based on these confirmed contracts.
- Any contract deviations discovered during implementation must be escalated immediately.

---

## Revision History

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| — | 1.0 | Initial checklist created | Mobile Team |
