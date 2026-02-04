package com.example.model;

import java.math.BigDecimal;
import java.util.Date;

public class User {

    private int userId;                 // user_id int PK
    private Date birthday;              // birthday Date
    private String username;            // username nvarchar(50)

    private String firstName;           // first_name nvarchar(50) not null
    private String lastName;            // last_name nvarchar(50) not null
    private String email;               // email unique not null
    private String phoneNumber;         // phone_number unique not null
    private String address;             // address not null

    private Date lastLogin;             // last_login DateTime
    private Date createdAt;             // create_at DateTime

    private boolean active;             // is_active BIT default 1
    private String password;            // password nvarchar(MAX)
    private String avatar;              // avatar nvarchar(MAX)

    private BigDecimal balance;         // balance decimal(18,2) default 0
    private Integer rank;               // rank int (có thể null)

    public User() {}
    public User(String firstName, String lastName, String username,
                String phoneNumber, String email, String address, String password) {
        this.firstName = firstName;
        this.lastName = lastName;
        this.username = username;
        this.phoneNumber = phoneNumber;
        this.email = email;
        this.address = address;
        this.password = password;
    }

    public int getUserId() { return userId; }
    public void setUserId(int userId) { this.userId = userId; }

    public Date getBirthday() { return birthday; }
    public void setBirthday(Date birthday) { this.birthday = birthday; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }

    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public Date getLastLogin() { return lastLogin; }
    public void setLastLogin(Date lastLogin) { this.lastLogin = lastLogin; }

    public Date getCreatedAt() { return createdAt; }
    public void setCreatedAt(Date createdAt) { this.createdAt = createdAt; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getAvatar() { return avatar; }
    public void setAvatar(String avatar) { this.avatar = avatar; }

    public BigDecimal getBalance() { return balance; }
    public void setBalance(BigDecimal balance) { this.balance = balance; }

    public Integer getRank() { return rank; }
    public void setRank(Integer rank) { this.rank = rank; }
  
    
}