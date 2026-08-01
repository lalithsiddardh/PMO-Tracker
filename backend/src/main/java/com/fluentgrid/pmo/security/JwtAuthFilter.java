package com.fluentgrid.pmo.security;

import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.annotation.Order;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
@Order(1)
public class JwtAuthFilter extends OncePerRequestFilter {

  private final JwtUtil jwtUtil;

  public JwtAuthFilter(JwtUtil jwtUtil) {
    this.jwtUtil = jwtUtil;
  }

  @Override
  protected void doFilterInternal(HttpServletRequest request,
      HttpServletResponse response,
      FilterChain filterChain) throws ServletException, IOException {

    System.out.println("==== JWT FILTER START ====");
    System.out.println(request.getMethod() + " " + request.getRequestURI());

    String authHeader = request.getHeader("Authorization");
    System.out.println("Authorization header present = " + (authHeader != null));

    if (authHeader == null || !authHeader.startsWith("Bearer ")) {
      System.out.println("==== JWT FILTER: No valid Bearer token, skipping ====");
      filterChain.doFilter(request, response);
      return;
    }

    String token = authHeader.substring(7);
    System.out.println("Token present = " + (token != null && !token.isEmpty()));

    try {
      Claims claims = jwtUtil.validateToken(token);
      String email = claims.getSubject();
      String role = claims.get("role", String.class);
      Long userId = claims.get("userId", Long.class);

      System.out.println("Email = " + email);
      System.out.println("Role = " + role);
      System.out.println("UserId = " + userId);

      List<SimpleGrantedAuthority> authorities = List.of(new SimpleGrantedAuthority("ROLE_" + role));
      System.out.println("Granted authorities = [ROLE_" + role + "]");

      UsernamePasswordAuthenticationToken authentication =
        new UsernamePasswordAuthenticationToken(email, userId, authorities);
      authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

      SecurityContextHolder.getContext().setAuthentication(authentication);
      System.out.println("Authentication in SecurityContext = " + SecurityContextHolder.getContext().getAuthentication());
      System.out.println("Principal = " + SecurityContextHolder.getContext().getAuthentication().getPrincipal());
      System.out.println("Authorities = " + SecurityContextHolder.getContext().getAuthentication().getAuthorities());
    } catch (Exception e) {
      System.out.println("==== JWT FILTER: Token validation FAILED ====");
      System.out.println("Exception: " + e.getClass().getName() + ": " + e.getMessage());
      SecurityContextHolder.clearContext();
      response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
      response.setContentType("application/json");
      response.getWriter().write("{\"error\":\"Unauthorized\",\"message\":\"" + e.getMessage() + "\"}");
      return;
    }

    System.out.println("==== JWT FILTER END ====");
    filterChain.doFilter(request, response);
  }

  private void sendUnauthorized(HttpServletResponse response, String message) throws IOException {
    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
    response.setContentType("application/json");
    response.getWriter().write("{\"error\":\"Unauthorized\",\"message\":\"" + message + "\"}");
  }

  @Override
  protected boolean shouldNotFilter(HttpServletRequest request) {
    String path = request.getServletPath();
    if (path.startsWith("/api/auth/")) {
      System.out.println("==== JWT FILTER: shouldNotFilter=true for " + path + " ====");
      return true;
    }
    return false;
  }
}
