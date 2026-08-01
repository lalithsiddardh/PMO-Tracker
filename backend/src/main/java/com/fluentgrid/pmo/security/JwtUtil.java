package com.fluentgrid.pmo.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Base64;
import java.util.Date;

@Component
public class JwtUtil {

  private final SecretKey secretKey;
  private final long expiration;

  public JwtUtil(
      @Value("${jwt.secret}") String secret,
      @Value("${jwt.expiration}") long expiration) {
    byte[] keyBytes = Base64.getDecoder().decode(secret);
    this.secretKey = Keys.hmacShaKeyFor(keyBytes);
    this.expiration = expiration;
  }

  public String generateToken(String email, String role, Long userId) {
    Date now = new Date();
    return Jwts.builder()
      .subject(email)
      .claim("role", role)
      .claim("userId", userId)
      .issuedAt(now)
      .expiration(new Date(now.getTime() + expiration))
      .signWith(secretKey)
      .compact();
  }

  public Claims validateToken(String token) {
    return Jwts.parser()
      .verifyWith(secretKey)
      .build()
      .parseSignedClaims(token)
      .getPayload();
  }
}
