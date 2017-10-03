using System;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.ProjectOxford.Face;
using Microsoft.ProjectOxford.Face.Contract;
using OSAPI.Utils;

namespace OSAPI
{
    public class PersonController : Controller
    {
        private const string _faceApiKey = "<your key>";
        private const string _faceApiEndpoint = "https://<your DC>.api.cognitive.microsoft.com/face/v1.0";

        [Route("api/group")]
        [HttpPost]
        public async Task<ActionResult> CreateGroup([FromBody]string groupId)
        {
            var client = new FaceServiceClient(_faceApiKey, _faceApiEndpoint);
            try
            {
                await client.CreatePersonGroupAsync(groupId, groupId);
                return Created($"/api/group/{groupId}", groupId);
            }
            catch (FaceAPIException ex)
            {
                return BadRequest(ex.ErrorMessage);
            }
        }

        [Route("api/group/{groupId}/person")]
        [HttpPost]
        public async Task<ActionResult> CreatePerson([FromBody]string name, string groupId)
        {
            var client = new FaceServiceClient(_faceApiKey, _faceApiEndpoint);
            try
            {
                CreatePersonResult result = await client.CreatePersonAsync(groupId, name);
                return Created(result.PersonId.ToString(), result.PersonId);
            }
            catch (FaceAPIException ex)
            {
                return BadRequest(ex.ErrorMessage);
            }
        }

        [Route("api/group/{groupId}/person/{personId}/faces")]
        [HttpPost]
        public async Task<ActionResult> AddPersonFace([FromBody]string imageFile, string groupId, string personId)
        {
            var client = new FaceServiceClient(_faceApiKey, _faceApiEndpoint);

            Stream image = Images.DecodeBase64Image(imageFile);
            try
            {
                var addFaceResult = await client.AddPersonFaceAsync(groupId, Guid.Parse(personId), image);
                return Created(addFaceResult.PersistedFaceId.ToString(), addFaceResult.PersistedFaceId);
            }
            catch (FaceAPIException ex)
            {
                return BadRequest(ex.ErrorMessage);
            }
        }

        [Route("api/group/{groupId}/train")]
        [HttpPost]
        public async Task<ActionResult> TrainGroup(string groupId)
        {
            using (var client = new FaceServiceClient(_faceApiKey, _faceApiEndpoint))
            {
                await client.TrainPersonGroupAsync(groupId);
            }

            return Ok();
        }

        [Route("api/group/{groupId}/identify")]
        [HttpPost]
        public async Task<ActionResult> Identify([FromBody]string imageFile, string groupId)
        {
            var client = new FaceServiceClient(_faceApiKey, _faceApiEndpoint);

            Stream image = Images.DecodeBase64Image(imageFile);
            Face[] detectResult = await client.DetectAsync(image);
            if (detectResult.Length > 0)
            {
                Face firstFace = detectResult[0];
                IdentifyResult[] identResult = await client.IdentifyAsync(groupId, new Guid[] { firstFace.FaceId });
                Guid? topResultId = identResult.FirstOrDefault().Candidates.FirstOrDefault()?.PersonId;
                if (topResultId != null)
                {
                    var person = await client.GetPersonAsync(groupId, topResultId.Value);
                    return Ok(person.Name);
                }
                else
                {
                    return Ok("Unknown person...");
                }
            }
            else
            {
                return NotFound("No faces found on the image.");
            }
        }
    }
}