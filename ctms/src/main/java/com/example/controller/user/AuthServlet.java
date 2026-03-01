// package com.example.controller.user;

// import java.io.IOException;
// import java.util.HashMap;
// import java.util.Map;

// import com.example.model.entity.User;
// import com.example.service.user.AuthService;
// import com.google.gson.Gson;

// import jakarta.servlet.annotation.WebServlet;
// import jakarta.servlet.http.HttpServlet;
// import jakarta.servlet.http.HttpServletRequest;
// import jakarta.servlet.http.HttpServletResponse;
// import jakarta.servlet.http.HttpSession;

// @WebServlet("/api/auth/*")
// public class AuthServlet extends HttpServlet {

//     private AuthService authService = new AuthService();
//     private Gson gson = new Gson();

//     @Override
//     protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
    
//         resp.setContentType("application/json");
//         resp.setCharacterEncoding("UTF-8");

//         String path = req.getPathInfo();
//         Map<String, Object> responseData = new HashMap<>();

//         try {
//             Map body = gson.fromJson(req.getReader(), Map.class);

//             if ("/login".equals(path)) {
//                 String email = (String) body.get("email");
//                 String password = (String) body.get("password");

//                 responseData = authService.login(email, password);

//                 if (Boolean.TRUE.equals(responseData.get("success"))) {
//                     HttpSession session = req.getSession(true);
//                     session.setAttribute("user", responseData.get("user"));
//                     session.setAttribute("role", responseData.get("role"));
//                     session.setMaxInactiveInterval(30 * 60);
//                 }

//             } else if ("/register".equals(path)) {
//                 User newUser = new User();
//                 newUser.setUsername((String) body.get("username"));
//                 newUser.setFirstName((String) body.get("firstName"));
//                 newUser.setLastName((String) body.get("lastName"));
//                 newUser.setEmail((String) body.get("email"));
//                 newUser.setPhoneNumber((String) body.get("phone"));
//                 newUser.setAddress((String) body.get("address"));
//                 newUser.setPassword((String) body.get("password"));

//                 String confirmPass = (String) body.get("confirmPassword");
//                 responseData = authService.register(newUser, confirmPass);

//             } else if ("/logout".equals(path)) {
//                 HttpSession session = req.getSession(false);
//                 if (session != null) session.invalidate();

//                 responseData.put("success", true);
//                 responseData.put("message", "Đã đăng xuất.");

//             } else {
//                 resp.setStatus(HttpServletResponse.SC_NOT_FOUND);
//                 responseData.put("success", false);
//                 responseData.put("message", "Invalid API Endpoint");
//             }

//             resp.getWriter().write(gson.toJson(responseData));

//         } catch (Exception e) {
//             e.printStackTrace();
//             resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
//             Map<String, Object> error = new HashMap<>();
//             error.put("success", false);
//             error.put("message", "Lỗi Server: " + e.getMessage());
//             resp.getWriter().write(gson.toJson(error));
//         }
//     }

//     @Override
//     protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
//         resp.setContentType("application/json");
//         resp.setCharacterEncoding("UTF-8");

//         String path = req.getPathInfo();
//         Map<String, Object> data = new HashMap<>();

//         if ("/me".equals(path)) {
//             HttpSession session = req.getSession(false);
//             if (session == null || session.getAttribute("user") == null) {
//                 resp.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
//                 data.put("success", false);
//                 data.put("message", "Not logged in");
//             } else {
//                 data.put("success", true);
//                 data.put("user", session.getAttribute("user"));
//                 data.put("role", session.getAttribute("role"));
//             }
//             resp.getWriter().write(gson.toJson(data));
//             return;
//         }

//         resp.setStatus(HttpServletResponse.SC_NOT_FOUND);
//         data.put("success", false);
//         data.put("message", "Invalid API Endpoint");
//         resp.getWriter().write(gson.toJson(data));
//     }

//     @Override
//     protected void doOptions(HttpServletRequest req, HttpServletResponse resp) {
//         resp.setStatus(HttpServletResponse.SC_OK);
//     }
// }
