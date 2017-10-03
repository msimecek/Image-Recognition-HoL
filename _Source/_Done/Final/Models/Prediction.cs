namespace OSAPI.Models
{
    using System;
    using System.Net;
    using System.Collections.Generic;

    public class Prediction
    {
        public string Tag { get; set; }
        public double Probability { get; set; }
        public string TagId { get; set; }
    }
}