using System.ComponentModel.DataAnnotations;

namespace IntelliInspect.Api.Models;

public class Dataset
{
    public int Id { get; set; }
    
    [Required]
    public string FileName { get; set; } = string.Empty;
    
    [Required]
    public string FilePath { get; set; } = string.Empty;
    
    public int TotalRows { get; set; }
    public int TotalColumns { get; set; }
    public double PassRate { get; set; }
    public DateTime? EarliestTimestamp { get; set; }
    public DateTime? LatestTimestamp { get; set; }
    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;
    
    // Training configuration
    public DateTime? TrainingStartDate { get; set; }
    public DateTime? TrainingEndDate { get; set; }
    public DateTime? TestingStartDate { get; set; }
    public DateTime? TestingEndDate { get; set; }
    public DateTime? SimulationStartDate { get; set; }
    public DateTime? SimulationEndDate { get; set; }
    
    public int? TrainingRecordCount { get; set; }
    public int? TestingRecordCount { get; set; }
    public int? SimulationRecordCount { get; set; }
    
    public string? ModelId { get; set; }
    public bool IsModelTrained { get; set; } = false;
}
