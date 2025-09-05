using IntelliInspect.Api.DTOs;

namespace IntelliInspect.Api.Services;

public interface IMlService
{
    Task<TrainingResponse> TrainModelAsync(List<Dictionary<string, object>> trainingData, List<Dictionary<string, object>> testingData, int datasetId);
    Task<(int prediction, double confidence)> PredictAsync(string modelId, Dictionary<string, object> data);
}
