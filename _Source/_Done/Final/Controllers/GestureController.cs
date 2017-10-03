using System.IO;
using System.Linq;
using System.Net.Http;
using System.Threading.Tasks;
using OSAPI.Models;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using OSAPI.Utils;

namespace OSAPI
{
    [Route("api/[controller]")]
    public class GestureController : Controller
    {
        [HttpPost]
        public async Task<ActionResult> Post([FromBody] string imageFile)
        {
            var prediction = await SendPredictionRequest(imageFile);
            return Ok(JsonConvert.SerializeObject(prediction));
        }

        private async Task<Prediction> SendPredictionRequest(string base64image)
        {
            const string _predictionKey = "[your key]";
            const string _predictionUrl = "[your URL]";

            Stream imageStream = Images.DecodeBase64Image(base64image);
            Prediction topResult = null;

            using (var client = new HttpClient())
            {
                client.DefaultRequestHeaders.Add("Prediction-Key", _predictionKey);

                var content = new StreamContent(imageStream);
                HttpResponseMessage response = await client.PostAsync(_predictionUrl, content);

                if (response.IsSuccessStatusCode)
                {
                    string res = await response.Content.ReadAsStringAsync();
                    PredictionResult result = JsonConvert.DeserializeObject<PredictionResult>(res);
                    topResult = GetTopPrediction(result);
                }
            }

            return topResult;
        }

        private Prediction GetTopPrediction(PredictionResult predictionResult)
        {
            return predictionResult.Predictions.OrderByDescending(p => p.Probability).FirstOrDefault();
        }
    }
}