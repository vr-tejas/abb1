using IntelliInspect.Api.DTOs;
using System.Text;
using System.Text.Json;

namespace IntelliInspect.Api.Services;

public class MlService : IMlService
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;
    private readonly string _mlServiceUrl;

    public MlService(HttpClient httpClient, IConfiguration configuration)
    {
        _httpClient = httpClient;
        _configuration = configuration;
        _mlServiceUrl = _configuration["ML_SERVICE_URL"] ?? "http://ml-service-python:8000";
    }

    public async Task<TrainingResponse> TrainModelAsync(List<Dictionary<string, object>> trainingData, List<Dictionary<string, object>> testingData, int datasetId)
    {
        var request = new
        {
            dataset_id = datasetId.ToString(),
            training_data = trainingData,
            testing_data = testingData
        };

        var json = JsonSerializer.Serialize(request);
        var content = new StringContent(json, Encoding.UTF8, "application/json");

        try
        {
            var response = await _httpClient.PostAsync($"{_mlServiceUrl}/train", content);
            
            if (!response.IsSuccessStatusCode)
            {
                var errorContent = await response.Content.ReadAsStringAsync();
                throw new HttpRequestException($"ML service error: {response.StatusCode} - {errorContent}");
            }

            var responseContent = await response.Content.ReadAsStringAsync();
            var mlResponse = JsonSerializer.Deserialize<JsonElement>(responseContent);

            return new TrainingResponse
            {
                ModelId = mlResponse.GetProperty("model_id").GetString() ?? "",
                Accuracy = mlResponse.GetProperty("accuracy").GetDouble(),
                Precision = mlResponse.GetProperty("precision").GetDouble(),
                Recall = mlResponse.GetProperty("recall").GetDouble(),
                F1Score = mlResponse.GetProperty("f1_score").GetDouble(),
                ConfusionMatrix = JsonSerializer.Deserialize<int[][]>(mlResponse.GetProperty("confusion_matrix").GetRawText()) ?? Array.Empty<int[]>()
            };
        }
        catch (HttpRequestException)
        {
            throw;
        }
        catch (Exception ex)
        {
            throw new InvalidOperationException($"Failed to communicate with ML service: {ex.Message}", ex);
        }
    }

    public async Task<(int prediction, double confidence)> PredictAsync(string modelId, Dictionary<string, object> data)
    {
        var request = new
        {
            model_id = modelId,
            data = data
        };

        var json = JsonSerializer.Serialize(request);
        var content = new StringContent(json, Encoding.UTF8, "application/json");

        try
        {
            var response = await _httpClient.PostAsync($"{_mlServiceUrl}/predict", content);
            
            if (!response.IsSuccessStatusCode)
            {
                var errorContent = await response.Content.ReadAsStringAsync();
                throw new HttpRequestException($"ML service error: {response.StatusCode} - {errorContent}");
            }

            var responseContent = await response.Content.ReadAsStringAsync();
            var mlResponse = JsonSerializer.Deserialize<JsonElement>(responseContent);

            var prediction = mlResponse.GetProperty("prediction").GetInt32();
            var confidence = mlResponse.GetProperty("confidence").GetDouble();

            return (prediction, confidence);
        }
        catch (HttpRequestException)
        {
            throw;
        }
        catch (Exception ex)
        {
            throw new InvalidOperationException($"Failed to communicate with ML service: {ex.Message}", ex);
        }
    }
}
