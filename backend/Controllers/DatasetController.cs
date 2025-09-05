using IntelliInspect.Api.DTOs;
using IntelliInspect.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace IntelliInspect.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DatasetController : ControllerBase
{
    private readonly IDatasetService _datasetService;
    private readonly IMlService _mlService;

    public DatasetController(IDatasetService datasetService, IMlService mlService)
    {
        _datasetService = datasetService;
        _mlService = mlService;
    }

    [HttpPost("upload")]
    public async Task<ActionResult<DatasetUploadResponse>> UploadDataset(IFormFile file)
    {
        try
        {
            var result = await _datasetService.ProcessDatasetAsync(file);
            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Internal server error: {ex.Message}");
        }
    }

    [HttpPost("validate-dates")]
    public async Task<ActionResult<DateRangeResponse>> ValidateDateRanges([FromBody] DateRangeRequest request)
    {
        try
        {
            var result = await _datasetService.ValidateDateRangesAsync(request);
            
            if (!result.IsValid)
                return BadRequest(result);
                
            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Internal server error: {ex.Message}");
        }
    }

    [HttpPost("train/{datasetId}")]
    public async Task<ActionResult<TrainingResponse>> TrainModel(int datasetId)
    {
        try
        {
            var dataset = await _datasetService.GetDatasetAsync(datasetId);
            if (dataset == null)
                return NotFound("Dataset not found");

            if (!dataset.TrainingStartDate.HasValue || !dataset.TrainingEndDate.HasValue ||
                !dataset.TestingStartDate.HasValue || !dataset.TestingEndDate.HasValue)
                return BadRequest("Date ranges must be set before training");

            var trainingData = await _datasetService.GetDataForRangeAsync(datasetId, dataset.TrainingStartDate.Value, dataset.TrainingEndDate.Value);
            var testingData = await _datasetService.GetDataForRangeAsync(datasetId, dataset.TestingStartDate.Value, dataset.TestingEndDate.Value);

            if (!trainingData.Any() || !testingData.Any())
                return BadRequest("Insufficient data for training");

            var result = await _mlService.TrainModelAsync(trainingData, testingData, datasetId);

            // Update dataset with model info
            dataset.ModelId = result.ModelId;
            dataset.IsModelTrained = true;
            await _datasetService.SaveDatasetAsync(dataset); // Save the updated dataset

            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Internal server error: {ex.Message}");
        }
    }

    [HttpGet("simulation/{datasetId}")]
    public async Task<ActionResult<IEnumerable<SimulationRow>>> GetSimulationData(int datasetId)
    {
        try
        {
            var result = await _datasetService.GetSimulationDataAsync(datasetId);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Internal server error: {ex.Message}");
        }
    }

    [HttpPost("simulate/{datasetId}")]
    public async Task<ActionResult<SimulationResponse>> SimulateStep(int datasetId, [FromBody] SimulationRow row)
    {
        try
        {
            var dataset = await _datasetService.GetDatasetAsync(datasetId);
            if (dataset == null)
                return NotFound("Dataset not found");

            if (string.IsNullOrEmpty(dataset.ModelId))
                return BadRequest("Model must be trained first");

            var (prediction, confidence) = await _mlService.PredictAsync(dataset.ModelId, row.Data);

            var response = new SimulationResponse
            {
                Row = new SimulationRow
                {
                    RowIndex = row.RowIndex,
                    Timestamp = row.Timestamp,
                    Prediction = prediction,
                    Confidence = confidence,
                    Data = row.Data
                },
                IsCompleted = false
            };

            return Ok(response);
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Internal server error: {ex.Message}");
        }
    }

    [HttpGet("{datasetId}")]
    public async Task<ActionResult<DatasetUploadResponse>> GetDataset(int datasetId)
    {
        try
        {
            var dataset = await _datasetService.GetDatasetAsync(datasetId);
            if (dataset == null)
                return NotFound("Dataset not found");

            return Ok(new DatasetUploadResponse
            {
                DatasetId = dataset.Id,
                FileName = dataset.FileName,
                TotalRows = dataset.TotalRows,
                TotalColumns = dataset.TotalColumns,
                PassRate = dataset.PassRate,
                EarliestTimestamp = dataset.EarliestTimestamp,
                LatestTimestamp = dataset.LatestTimestamp
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Internal server error: {ex.Message}");
        }
    }
}
