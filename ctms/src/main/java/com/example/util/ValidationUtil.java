package com.example.util;

import java.util.HashMap;

import com.example.DAO.UserDAO;

public class ValidationUtil {

    public static HashMap<String, String> validateRegister(
            String firstName,
            String lastName,
            String username,
            String phone,
            String email,
            String password,
            String confirmPassword,
            boolean agree,
            String address
    ) {

        HashMap<String, String> errors = new HashMap<>();

        if (firstName == null || firstName.trim().isEmpty())
            errors.put("firstName", "First name is required");

        if (lastName == null || lastName.trim().isEmpty())
            errors.put("lastName", "Last name is required");

        if (username == null || username.trim().isEmpty())
            errors.put("username", "Username is required");
        else if (username.trim().length() > 50)
            errors.put("username", "Username must not exceed 50 characters");


        if (address == null || address.trim().isEmpty())
            errors.put("address", "Address is required");
   
        if (email == null || email.trim().isEmpty()
            || !email.matches("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$")) {
             errors.put("email", "Invalid email format");
    }


        if (phone == null || phone.trim().isEmpty()
                || !phone.matches("^0\\d{9}$")) {
            errors.put("phone", "Invalid phone number");
        }


        if (password == null || password.length() < 6)
            errors.put("password", "Password must be at least 6 characters");

        if (confirmPassword == null || password == null || !password.equals(confirmPassword)) 
            errors.put("confirmPassword", "Password not match");
        
        if (!agree)
            errors.put("agree", "You must accept terms");

        if (errors.isEmpty()) {
            UserDAO dao = new UserDAO();

            if (dao.isEmailExists(email))
                errors.put("email", "Email already exists");

            if (dao.isPhoneExists(phone))
                errors.put("phone", "Phone number already exists");

            if (dao.isUsernameExists(username))
                errors.put("username", "Username already exists");
        }

        return errors;
    }
}
