package com.example.controller.leader;
import java.io.IOException;
import java.util.Arrays;
import java.util.List;

import com.example.DAO.UserDAO;
import com.example.model.entity.User;
import com.google.gson.Gson;

import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@WebServlet("/api/tournaments/users")
public class TournamentUserController extends HttpServlet {

    private UserDAO dao = new UserDAO();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp)
            throws IOException {

        resp.setContentType("application/json");

        String idsParam = req.getParameter("ids"); // "1,2,3"
        if (idsParam == null || idsParam.isBlank()) {
            resp.getWriter().write("[]");
            return;
        }

        List<Integer> ids = Arrays.stream(idsParam.split(","))
                                  .map(Integer::parseInt)
                                  .toList();

        List<User> users = dao.getUsersByIds(ids);

        resp.getWriter().write(new Gson().toJson(users));
    }
}
