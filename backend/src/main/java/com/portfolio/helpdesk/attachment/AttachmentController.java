package com.portfolio.helpdesk.attachment;

import com.portfolio.helpdesk.security.AuthenticatedUser;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/tickets/{ticketId}/attachments")
@RequiredArgsConstructor
public class AttachmentController {
    private final AttachmentService service;

    @GetMapping
    public List<AttachmentDtos.Response> list(@PathVariable Long ticketId, @AuthenticationPrincipal AuthenticatedUser actor) {
        return service.list(ticketId, actor);
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public AttachmentDtos.Response upload(
        @PathVariable Long ticketId,
        @RequestParam("file") MultipartFile file,
        @AuthenticationPrincipal AuthenticatedUser actor
    ) {
        return service.upload(ticketId, file, actor);
    }

    @GetMapping("/{attachmentId}/download")
    public ResponseEntity<?> download(
        @PathVariable Long ticketId,
        @PathVariable Long attachmentId,
        @AuthenticationPrincipal AuthenticatedUser actor
    ) {
        AttachmentService.Download download = service.download(ticketId, attachmentId, actor);
        return ResponseEntity.ok()
            .contentType(MediaType.parseMediaType(download.contentType()))
            .contentLength(download.sizeBytes())
            .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment().filename(download.fileName()).build().toString())
            .body(download.resource());
    }
}
