using Microsoft.EntityFrameworkCore;
using ClassroomClone.Api.Models;

namespace ClassroomClone.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Profile> Profiles => Set<Profile>();
    public DbSet<Class> Classes => Set<Class>();
    public DbSet<Enrollment> Enrollments => Set<Enrollment>();
    public DbSet<Assignment> Assignments => Set<Assignment>();
    public DbSet<Quiz> Quizzes => Set<Quiz>();
    public DbSet<QuestionSet> QuestionSets => Set<QuestionSet>();
    public DbSet<Material> Materials => Set<Material>();
    public DbSet<Announcement> Announcements => Set<Announcement>();
    public DbSet<QuizSubmission> QuizSubmissions => Set<QuizSubmission>();
    public DbSet<QuestionSetSubmission> QuestionSetSubmissions => Set<QuestionSetSubmission>();
    public DbSet<QuizTemplate> QuizTemplates => Set<QuizTemplate>();
    public DbSet<AssignmentTemplate> AssignmentTemplates => Set<AssignmentTemplate>();
    public DbSet<MaterialTemplate> MaterialTemplates => Set<MaterialTemplate>();
    public DbSet<TeacherSchedule> TeacherSchedules => Set<TeacherSchedule>();
    public DbSet<TemplateApprovalHistory> TemplateApprovalHistories => Set<TemplateApprovalHistory>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Profile>(e =>
        {
            e.HasIndex(p => p.UserId).IsUnique();
            e.HasOne<User>().WithOne(u => u.Profile).HasForeignKey<Profile>(p => p.UserId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<User>(e =>
        {
            e.HasIndex(u => u.Email).IsUnique();
        });

        modelBuilder.Entity<Class>(e =>
        {
            e.HasIndex(c => c.StreamCode).IsUnique();
            e.HasIndex(c => c.CreatorId);
            e.HasOne(c => c.Creator).WithMany().HasForeignKey(c => c.CreatorId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Enrollment>(e =>
        {
            e.HasIndex(x => new { x.UserId, x.ClassId }).IsUnique();
            e.HasIndex(x => x.ClassId);
            e.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Assignment>(e =>
        {
            e.HasIndex(a => a.ClassId);
            e.HasOne(a => a.Quiz).WithMany().HasForeignKey(a => a.QuizId).OnDelete(DeleteBehavior.SetNull);
            e.HasOne(a => a.QuestionSet).WithMany().HasForeignKey(a => a.QuestionSetId).OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<Quiz>(e =>
        {
            e.HasIndex(q => q.ClassId);
        });

        modelBuilder.Entity<QuestionSet>(e =>
        {
            e.HasIndex(q => q.ClassId);
        });

        modelBuilder.Entity<Material>(e =>
        {
            e.HasIndex(m => m.ClassId);
        });

        modelBuilder.Entity<Announcement>(e =>
        {
            e.HasIndex(a => a.ClassId);
            e.HasOne(a => a.Author).WithMany().HasForeignKey(a => a.AuthorId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<QuizSubmission>(e =>
        {
            e.HasIndex(x => new { x.QuizId, x.UserId }).IsUnique();
            e.HasIndex(x => x.QuizId);
            e.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<QuestionSetSubmission>(e =>
        {
            e.HasIndex(x => new { x.QuestionSetId, x.UserId }).IsUnique();
            e.HasIndex(x => x.QuestionSetId);
            e.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<QuizTemplate>(e =>
        {
            e.HasIndex(t => t.CreatedBy);
            e.HasOne(t => t.Creator).WithMany().HasForeignKey(t => t.CreatedBy).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<AssignmentTemplate>(e =>
        {
            e.HasIndex(t => t.CreatedBy);
            e.HasOne(t => t.Creator).WithMany().HasForeignKey(t => t.CreatedBy).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<MaterialTemplate>(e =>
        {
            e.HasIndex(t => t.CreatedBy);
            e.HasOne(t => t.Creator).WithMany().HasForeignKey(t => t.CreatedBy).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<TeacherSchedule>(e =>
        {
            e.HasIndex(s => s.TeacherId);
            e.HasIndex(s => s.ClassId);
            e.HasOne(s => s.Teacher).WithMany().HasForeignKey(s => s.TeacherId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(s => s.Class).WithMany().HasForeignKey(s => s.ClassId).OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<TemplateApprovalHistory>(e =>
        {
            e.HasIndex(h => h.TemplateId);
            e.HasIndex(h => h.CreatedBy);
            e.HasIndex(h => h.ReviewedBy);
            e.HasOne(h => h.Creator).WithMany().HasForeignKey(h => h.CreatedBy).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(h => h.Reviewer).WithMany().HasForeignKey(h => h.ReviewedBy).OnDelete(DeleteBehavior.Restrict);
        });
    }
}
