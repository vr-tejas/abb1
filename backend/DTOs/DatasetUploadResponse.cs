namespace IntelliInspect.Api.DTOs;

public class DatasetUploadResponse
{
    public int DatasetId { get; set; }
    public string FileName { get; set; } = string.Empty;
    public int TotalRows { get; set; }
    public int TotalColumns { get; set; }
    public double PassRate { get; set; }
    public DateTime? EarliestTimestamp { get; set; }
    public DateTime? LatestTimestamp { get; set; }
}

public class DateRangeRequest
{
    public int DatasetId { get; set; }
    public DateTime TrainingStartDate { get; set; }
    public DateTime TrainingEndDate { get; set; }
    public DateTime TestingStartDate { get; set; }
    public DateTime TestingEndDate { get; set; }
    public DateTime SimulationStartDate { get; set; }
    public DateTime SimulationEndDate { get; set; }
}

public class DateRangeResponse
{
    public bool IsValid { get; set; }
    public string? ErrorMessage { get; set; }
    public int TrainingRecordCount { get; set; }
    public int TestingRecordCount { get; set; }
    public int SimulationRecordCount { get; set; }
}

public class TrainingResponse
{
    public string ModelId { get; set; } = string.Empty;
    public double Accuracy { get; set; }
    public double Precision { get; set; }
    public double Recall { get; set; }
    public double F1Score { get; set; }
    public int[][] ConfusionMatrix { get; set; } = Array.Empty<int[]>();
}

public class SimulationRow
{
    public int RowIndex { get; set; }
    public DateTime Timestamp { get; set; }
    public int Prediction { get; set; }
    public double Confidence { get; set; }
    public Dictionary<string, object> Data { get; set; } = new();
}

public class SimulationResponse
{
    public SimulationRow Row { get; set; } = new();
    public bool IsCompleted { get; set; }
}
