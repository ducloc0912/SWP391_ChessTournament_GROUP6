package com.example.util;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

public class DBContext {

    private static final String DB_URL =
            "jdbc:sqlserver://localhost:1433;"
          + "databaseName=SWP391;"
          + "encrypt=true;"
          + "trustServerCertificate=true;"
          + "sendStringParametersAsUnicode=true";

    private static final String USER = "sa";
    private static final String PASSWORD = "123";

    public static Connection getConnection() {
        Connection conn = null;
        try {
            Class.forName("com.microsoft.sqlserver.jdbc.SQLServerDriver");
            conn = DriverManager.getConnection(DB_URL, USER, PASSWORD);
            System.out.println(" Connected to SQL Server successfully!");
        } catch (ClassNotFoundException e) {
            System.out.println(" JDBC Driver not found!");
            e.printStackTrace();
        } catch (SQLException e) {
            System.out.println(" Connection failed!");
            e.printStackTrace();
        }
        return conn;
    }
    public static void main(String[] args) {
        Connection conn = null;
        try {
            conn = getConnection();
            if (conn != null) {
                System.out.println(" KẾT NỐI DATABASE THÀNH CÔNG!");
            } else {
                System.out.println(" KẾT NỐI DATABASE THẤT BẠI!");
            }
        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            try {
                if (conn != null) {
                    conn.close();
                    System.out.println("🔌 Đã đóng kết nối.");
                }
            } catch (SQLException e) {
                e.printStackTrace();
            }
        }
    }
}
