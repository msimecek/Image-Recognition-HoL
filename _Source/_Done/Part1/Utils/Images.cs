using System.IO;
using System.Text.RegularExpressions;

namespace OSAPI.Utils
{
    public static class Images
    {
        public static Stream DecodeBase64Image(string base64Image)
        {
            var base64Data = Regex.Match(base64Image, @"data:image/(?<type>.+?),(?<data>.+)").Groups["data"].Value;
            byte[] data = System.Convert.FromBase64String(base64Data);
            MemoryStream ms = new MemoryStream(data);

            return ms;
        }
    }
}