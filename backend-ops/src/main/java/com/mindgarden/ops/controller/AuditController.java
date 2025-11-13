package com.mindgarden.ops.controller;

import com.mindgarden.ops.domain.audit.OpsAuditLog;
import com.mindgarden.ops.service.audit.AuditService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/audit")
public class AuditController {

    private final AuditService auditService;

    public AuditController(AuditService auditService) {
        this.auditService = auditService;
    }

    @GetMapping
    public ResponseEntity<List<OpsAuditLog>> getAuditLogs(@RequestParam(required = false) String eventType) {
        return ResponseEntity.ok(auditService.findRecent(eventType));
    }
}
