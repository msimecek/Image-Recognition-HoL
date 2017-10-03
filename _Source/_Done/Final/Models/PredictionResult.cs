namespace OSAPI.Models
{
    using System;
    using System.Net;
    using System.Collections.Generic;

    public class PredictionResult
    {
        public string Id { get; set; }
        public Prediction[] Predictions { get; set; }
        public string Created { get; set; }
        public string Iteration { get; set; }
        public string Project { get; set; }
    }

}