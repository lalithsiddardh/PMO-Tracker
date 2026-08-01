package com.fluentgrid.pmo.service;

import com.fluentgrid.pmo.model.Notification;
import com.fluentgrid.pmo.repository.NotificationRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class NotificationService {

  private final NotificationRepository notificationRepository;

  public NotificationService(NotificationRepository notificationRepository) {
    this.notificationRepository = notificationRepository;
  }

  public Notification createNotification(Long userId, String title, String message, String type) {
    Notification notification = new Notification();
    notification.setUserId(userId);
    notification.setTitle(title);
    notification.setMessage(message);
    notification.setType(type);
    notification.setIsRead(false);
    return notificationRepository.save(notification);
  }

  public List<Notification> getNotificationsForUser(Long userId) {
    return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
  }

  public List<Notification> getUnreadNotifications(Long userId) {
    return notificationRepository.findByUserIdAndIsReadFalse(userId);
  }

  public Notification markAsRead(Long id) {
    Notification notification = notificationRepository.findById(id)
      .orElseThrow(() -> new RuntimeException("Notification not found with id: " + id));
    notification.setIsRead(true);
    return notificationRepository.save(notification);
  }

  public void deleteNotification(Long id) {
    notificationRepository.deleteById(id);
  }
}
