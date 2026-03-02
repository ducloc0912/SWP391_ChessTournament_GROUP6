package com.example.model.entity;

import java.math.BigDecimal;
import java.sql.Timestamp;

public class PaymentTransaction {
    private Integer transactionId;
    private Integer userId;
    private Integer tournamentId;
    private String type;                // EntryFee, Prize, Refund, Deposit, Withdrawal
    private BigDecimal amount;
    private BigDecimal balanceAfter;
    private String description;
    private Integer referenceId;
    private Timestamp createAt;

    public PaymentTransaction() {}

    public PaymentTransaction(Integer transactionId, Integer userId, Integer tournamentId,
                              String type, BigDecimal amount, BigDecimal balanceAfter,
                              String description, Integer referenceId, Timestamp createAt) {
        this.transactionId = transactionId;
        this.userId = userId;
        this.tournamentId = tournamentId;
        this.type = type;
        this.amount = amount;
        this.balanceAfter = balanceAfter;
        this.description = description;
        this.referenceId = referenceId;
        this.createAt = createAt;
    }

    public Integer getTransactionId() { return transactionId; }
    public void setTransactionId(Integer transactionId) { this.transactionId = transactionId; }

    public Integer getUserId() { return userId; }
    public void setUserId(Integer userId) { this.userId = userId; }

    public Integer getTournamentId() { return tournamentId; }
    public void setTournamentId(Integer tournamentId) { this.tournamentId = tournamentId; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }

    public BigDecimal getBalanceAfter() { return balanceAfter; }
    public void setBalanceAfter(BigDecimal balanceAfter) { this.balanceAfter = balanceAfter; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Integer getReferenceId() { return referenceId; }
    public void setReferenceId(Integer referenceId) { this.referenceId = referenceId; }

    public Timestamp getCreateAt() { return createAt; }
    public void setCreateAt(Timestamp createAt) { this.createAt = createAt; }
}
