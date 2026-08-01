package com.fluentgrid.pmo.controller;

import com.fluentgrid.pmo.model.Notification;
import com.fluentgrid.pmo.service.NotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

  private final NotificationService notificationService;

  public NotificationController(NotificationService notificationService) {
    this.notificationService = notificationService;
  }

  private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(NotificationController.class);

  @GetMapping
  public ResponseEntity<List<Notification>> getNotifications(Authentication authentication) {
    Long userId = (Long) authentication.getCredentials();
    log.info("NotificationController.getNotifications() called by: {} | credentials(userId): {} | authorities: {}", authentication.getPrincipal(), authentication.getCredentials(), authentication.getAuthorities());
    return ResponseEntity.ok(notificationService.getNotificationsForUser(userId));
  }

  @GetMapping("/unread")
  public ResponseEntity<List<Notification>> getUnread(Authentication authentication) {
    Long userId = (Long) authentication.getCredentials();
    return ResponseEntity.ok(notificationService.getUnreadNotifications(userId));
  }

  @PatchMapping("/{id}/read")
  public ResponseEntity<Notification> markAsRead(@PathVariable Long id) {
    return ResponseEntity.ok(notificationService.markAsRead(id));
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<Void> deleteNotification(@PathVariable Long id) {
    notificationService.deleteNotification(id);
    return ResponseEntity.noContent().build();
  }
}
