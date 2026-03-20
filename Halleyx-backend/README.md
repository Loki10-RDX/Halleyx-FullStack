# Workflow Engine Backend

A dynamic **Workflow Automation Engine** built using **Spring Boot**, supporting configurable workflows, steps, rules, and execution logic with approval handling and email notifications.

---

#  Features

✅ Workflow creation with versioning
✅ Dynamic input schema support
✅ Step-based workflow execution
✅ Rule-based step transitions
✅ Approval system (Approve / Reject)
✅ Email notifications (Task / Approval / Notification)
✅ Execution tracking and retry/cancel support

---

# Architecture Overview

```
Workflow
   ↓
Steps (ordered)
   ↓
Rules (conditions)
   ↓
Execution Engine
   ↓
Step Executor (TASK / APPROVAL / NOTIFICATION)
```

---

#  Modules

## 1. Workflow

* Create / Update workflows
* Maintain versions
* Store input schema

## 2. Steps

* Define ordered steps inside workflow
* Step types:

    * TASK
    * APPROVAL
    * NOTIFICATION

## 3. Rules

* Define transition logic between steps
* Based on conditions

## 4. Execution

* Run workflow
* Move step → step
* Handle approval pause & resume

---

#  API Endpoints

---

## Workflow APIs

### Create Workflow

```
POST /workflows
```

### Get Workflow

```
GET /workflows/{id}
```

### Update Workflow

```
PUT /workflows/{id}
```

### Delete Workflow

```
DELETE /workflows/{id}
```

### Get Versions

```
GET /workflows/name/{name}
```

---

## 🪜 Step APIs

### Create Step

```
POST /workflows/{workflowId}/steps
```

### Get Steps

```
GET /workflows/{workflowId}/steps
```

### Update Step

```
PUT /steps/{id}
```

### Delete Step

```
DELETE /steps/{id}
```

---

## Rule APIs

### Create Rule

```
POST /steps/{stepId}/rules
```

### Get Rules

```
GET /steps/{stepId}/rules
```

### Update Rule

```
PUT /rules/{id}
```

### Delete Rule

```
DELETE /rules/{id}
```

---

## Execution APIs

### Start Execution

```
POST /workflows/{workflowId}/execute
```

### Run Workflow (Test API)

```
POST /run/{workflowId}
```

### Get Execution

```
GET /executions/{id}
```

### Cancel Execution

```
POST /executions/{id}/cancel
```

### Retry Execution

```
POST /executions/{id}/retry
```

---

##  Approval APIs

### Approve Workflow

```
POST /approve/{executionId}
```

### Reject Workflow

```
POST /reject/{executionId}
```

---

#  Workflow Execution Flow

```
1. Start workflow
2. Execute first step
3. Evaluate rules
4. Move to next step
5. Repeat until end
```

---

#  Step Behavior

##  TASK

* Sends email with task details
* Continues execution

## APPROVAL

* Sends approval email (Approve / Reject)
* Workflow pauses until user action

## NOTIFICATION

* Sends final status email
* Ends workflow

---

# Email Flow

| Step Type    | Email Behavior        |
| ------------ | --------------------- |
| TASK         | Task details sent     |
| APPROVAL     | Approval request sent |
| NOTIFICATION | Final result sent     |

---

#  Example Flow

```
Task → Approval → Notification
```

Execution:

```
1. Task email sent
2. Approval email sent (wait)
3. User approves
4. Notification email sent
```

---

#  Tech Stack

* Java 17+
* Spring Boot
* Spring Data JPA
* REST APIs
* PostgreSQL / MySQL
* Maven

---

#  How to Run

```bash
mvn spring-boot:run
```

---

# Base URL

```
http://localhost:8080
```

---

#  Future Improvements

* UI for approval actions
* Drag & drop step ordering
* Advanced rule engine
* Audit logs
* Role-based access control

---

# Author

**Workflow Engine Implementation by Lokesh**

---
