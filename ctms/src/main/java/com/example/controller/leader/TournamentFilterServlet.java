package com.example.controller.leader;
import java.io.IOException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@WebServlet("/api/tournaments/filters")
public class TournamentFilterServlet extends HttpServlet {

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp)
            throws IOException {

        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");

        String json = """
        {
          "statuses": [
            "Pending",
            "Rejected",
            "Delayed",
            "Ongoing",
            "Completed",
            "Cancelled"
          ],
          "types": [
            "RoundRobin",
            "KnockOut",
            "Hybrid"
          ]
        }
        """;

        resp.getWriter().write(json);
    }
}
