package com.example.scheduler;

import com.example.DAO.PaymentDAO;
import com.example.DAO.StandingDAO;
import com.example.DAO.TournamentDAO;
import com.example.DAO.TournamentSchedulerDAO;
import com.example.model.dto.TournamentDTO;
import jakarta.servlet.ServletContextEvent;
import jakarta.servlet.ServletContextListener;
import jakarta.servlet.annotation.WebListener;

import java.math.BigDecimal;
import java.sql.Connection;
import java.util.List;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import java.util.logging.Logger;

@WebListener
public class TournamentStatusScheduler implements ServletContextListener {

    private static final Logger log = Logger.getLogger(TournamentStatusScheduler.class.getName());
    private ScheduledExecutorService scheduler;

    @Override
    public void contextInitialized(ServletContextEvent sce) {
        scheduler = Executors.newSingleThreadScheduledExecutor();

        // Chạy ngay lập tức, sau đó lặp lại mỗi 1 phút
        scheduler.scheduleAtFixedRate(this::checkAndUpdateStatuses, 0, 1, TimeUnit.MINUTES);

        log.info("[TournamentStatusScheduler] Khởi động thành công - kiểm tra mỗi 1 phút.");
    }

    private void checkAndUpdateStatuses() {
        try {
            TournamentSchedulerDAO schedulerDAO = new TournamentSchedulerDAO();
            TournamentDAO tournamentDAO = new TournamentDAO();
            StandingDAO standingDAO = new StandingDAO();
            PaymentDAO paymentDAO = new PaymentDAO();

            // Upcoming → Ongoing
            List<Integer> started = schedulerDAO.autoStartTournaments();
            if (!started.isEmpty()) {
                log.info("[Scheduler] Chuyển Upcoming → Ongoing: tournament_id = " + started);
            }

            // Ongoing → Completed (theo end_date)
            List<Integer> completed = schedulerDAO.autoCompleteTournaments();
            if (!completed.isEmpty()) {
                log.info("[Scheduler] Chuyển Ongoing → Completed: tournament_id = " + completed);

                // Với mỗi giải vừa kết thúc: cập nhật standings + chia giải thưởng
                for (int tournamentId : completed) {
                    distributeAfterCompletion(tournamentId, tournamentDAO, standingDAO, paymentDAO);
                }
            }

        } catch (Exception e) {
            log.severe("[Scheduler] Lỗi khi cập nhật trạng thái giải: " + e.getMessage());
            e.printStackTrace();
        }
    }

    private void distributeAfterCompletion(int tournamentId,
                                            TournamentDAO tournamentDAO,
                                            StandingDAO standingDAO,
                                            PaymentDAO paymentDAO) {
        try {
            // 1. Cập nhật standings
            try (Connection conn = com.example.util.DBContext.getConnection()) {
                standingDAO.updateStandingsForTournament(conn, tournamentId);
                log.info("[Scheduler] Đã cập nhật standings giải #" + tournamentId);
            } catch (Exception e) {
                log.warning("[Scheduler] Lỗi cập nhật standings giải #" + tournamentId + ": " + e.getMessage());
            }

            // 2. Kiểm tra giải thưởng chưa được chia
            if (paymentDAO.isPrizesAlreadyDistributed(tournamentId)) {
                log.info("[Scheduler] Giải #" + tournamentId + " đã được chia thưởng trước đó, bỏ qua.");
                return;
            }

            // 3. Lấy prize pool và chia
            TournamentDTO t = tournamentDAO.getTournamentById(tournamentId);
            if (t == null) return;

            BigDecimal prizePool = t.getPrizePool();
            if (prizePool == null || prizePool.compareTo(BigDecimal.ZERO) <= 0) {
                log.info("[Scheduler] Giải #" + tournamentId + " không có giải thưởng để chia.");
                return;
            }

            boolean distributed = paymentDAO.distributePrizes(tournamentId, prizePool);
            if (distributed) {
                log.info("[Scheduler] Đã chia giải thưởng giải #" + tournamentId + " (" + prizePool.toPlainString() + " VND)");
            } else {
                log.warning("[Scheduler] Chia giải thưởng giải #" + tournamentId + " thất bại!");
            }

        } catch (Exception e) {
            log.severe("[Scheduler] Lỗi chia thưởng giải #" + tournamentId + ": " + e.getMessage());
            e.printStackTrace();
        }
    }

    @Override
    public void contextDestroyed(ServletContextEvent sce) {
        if (scheduler != null && !scheduler.isShutdown()) {
            scheduler.shutdownNow();
            log.info("[TournamentStatusScheduler] Đã dừng scheduler.");
        }
    }
}
