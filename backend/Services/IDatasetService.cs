using IntelliInspect.Api.DTOs;
using IntelliInspect.Api.Models;

namespace IntelliInspect.Api.Services;

public interface IDatasetService
{
    Task<DatasetUploadResponse> ProcessDatasetAsync(IFormFile file);
    Task<DateRangeResponse> ValidateDateRangesAsync(DateRangeRequest request);
    Task<Dataset?> GetDatasetAsync(int datasetId);
    Task<List<Dictionary<string, object>>> GetDataForRangeAsync(int datasetId, DateTime startDate, DateTime endDate);
    Task<List<SimulationRow>> GetSimulationDataAsync(int datasetId);
    Task SaveDatasetAsync(Dataset dataset);
}
