# Part 2 - Identify a Gesture

In this part our API is going to expand with another capability: to recognize gesture feedback. The idea is to have a fast and simple way of providing feedback upon leaving a physical retail store.

This is the result:

![](../Images/2-1-final.png)

We will use [Custom Vision API](https://azure.microsoft.com/en-us/services/cognitive-services/custom-vision-service/) and ASP.NET Core 2.0.

> Custom Vision Service is currently in Preview. It means that it's available free of charge, without SLA and with limits in place.

As is common with machine learning, there are two main steps in the process of understanding gestures: training & recognition.

![](../Images/2-0-gesture-recognition.png)

## Preparing the model

Unlike Part 1 we will work with a web-based portal this time.

1. Go to https://www.customvision.ai/ and sign in.
2. Click **New Project**.
3. Pick a **name** (e.g. *Customer Feedback*).
4. Keep domain as **General**.
5. Confirm by clicking **Create Project**.

Now go ahead and create two new tags: **Yes** and **No**. They will represent the Thumbs up and down gestures . You can of course call them however you like, I chose this for simplicity.

![](../Images/2-2-new-tag.png)



![](../Images/2-3-yesno.png)

To train the model and make it tag pictures correctly, you will need **at least 30 images per tag**. It's up to you how you take them - use the camera built into your computer, use your phone... Whatever you prefer to get images that show gestures.

> When taking pictures, try different angles, positions and lighting conditions.

![](../Images/2-4-add-images.png)

Tag each group appropriately.

![](../Images/2-5-tagging.png)

Once you're done uploading and tagging, click the green **Train** button at the top:

![](../Images/2-6-train.png)

After the training, you'll get results for the first iteration. It gives you two numbers:

* **Precision** means that if a tag is predicted by the classifier, how likely is that to be right.
* **Recall** means what percentage of your tags did the classifier find correctly.

My numbers aren't bad, but not amazing:

![](../Images/2-7-iteration1.png)

You can try quick test now. Take another picture with your camera and upload it to the Quick Test blade.

![](../Images/2-8-quicktest-button.png)

![](../Images/2-9-quicktest-result.png)

Feel free to experiment a little more - upload more training images, train another iteration, test it etc. You should see the precision increasing with the number of images you upload.

Mark whichever iteration you choose as default by clicking the **Make default** button.

![](../Images/2-10-make-default.png)

Finally, we will need a URL to call and a key to authenticate with. As you may have guessed, this information can be found under the **Prediction URL** button.

The value we want for our case is the second one - image file. Copy the URL and key somewhere you'll be able to find it later.

![](../Images/2-11-prediction-url.png)

## Using the model

Now with the model ready, we can start calling it and getting predictions. We are going to continue our work on the API from [TODO: Part 1]() and add more functionality to it.

> If you didn't go through Part 1, you will find the source code in _Source/\_Done/Part1.

1. Copy the **GestureFrontend** folder from *\_Source* to *\_Work*. Or anywhere else, if you prefer to work in a different directory.

2. Run **http-server** and browse to the site (http://localhost:8080) with your browser.

  > We did this in Part 1: To work with the camera, we need to serve the page from a HTTP location. That's why we use the http-server NPM package:
  >
  > `npm install http-server -g`
  >
  > `cd <folder with front-end page>`
  >
  > `http-server`

3. Open your API project in **Visual Studio Code**.

4. Add new file to the **Controllers** folder, call it **GestureController.cs**.

5. Add basic scaffolding to the controller:


```c#
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;

namespace OSAPI
{
    [Route("api/[controller]")]
    public class GestureController : Controller
    {
        [HttpPost]
        public async Task<ActionResult> Post([FromBody] string imageFile)
        {
            
        }
    }
}
```

There's some extra work that has to be done in order to call the Custom Vision API correctly. Since there's no .NET Core SDK available, we'll have to issue HTTP calls directly and parse raw responses. The API responds with JSON and we will add a library to help us parse it to C# objects.

Go to the command line, make sure it's pointing to your API project folder and type:

```
dotnet add package Newtonsoft.Json
```

VS Code will ask to **Restore** packages, so do that as well.

### Custom Vision API response

As written above, Custom Vision API returns a JSON object in this form:

```json
{
  "Id": "c65fb2c2-de50-459e-9a9c-8acacb73c2ac",
  "Project": "b0523a8e-26ad-4dc2-aeeb-3c286eff5f3e",
  "Iteration": "c804c7a9-2c7d-4764-b140-e67a6c67955a",
  "Created": "2017-10-01T14:44:25.7810394Z",
  "Predictions": [
    {
      "TagId": "4d982daa-546f-47c8-b095-6e70875fe044",
      "Tag": "No",
      "Probability": 0.120912969
    },
    {
      "TagId": "d80704dc-e7c3-43da-8490-c98133520962",
      "Tag": "Yes",
      "Probability": 3.79704979e-8
    }
  ]
}
```

To generate C# classes from JSON automatically, you can use Visual Studio 2017 (`Edit > Paste special > JSON as Classes`) or this website: https://quicktype.io/?r=json2csharp

Switch to C#, change Top-level type to **PredictionResult** and paste JSON into the textbox. 

Then change Generated namespace to **API.Models**.

![](../Images/2-12-json-csharp.png)

Then:

1. In VS Code create new folder, call it **Models**.
2. Add new file, call it **PredictionResult.cs**.
3. Paste the generated C# code into it.
4. If you want to take the "proper path", create another file, call it **Prediction.cs** and extract the Prediction class into it. Keep the same namespace.

Now is the right time to fill our **GestureController**.

1. Go to **GestureController.cs** in VS Code.
2. Add these two methods **under** the Post method and resolve missing references:

```c#
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
```

If you're new to .NET you may not know how to resolve missing references. They are represented as compile errors by red squiggly lines under parts of your code. Resolving them is usually very easy: place cursor to an underlined word, press `Ctrl + .` and select *using ...*.

![](../Images/1-6-squiggly.png)

This will add the required using statement to the top of the file. Repeat this for any other red lines. If the *using* doesn't show up it's probably because of a syntax error.

The top of **GestureController.cs** should then look like this:

```c#
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Threading.Tasks;
using OSAPI.Models;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using OSAPI.Utils;
```

Finally, add two lines of code into the **Post** method:

```c#
[HttpPost]
public async Task<ActionResult> Post([FromBody] string imageFile)
{
    var prediction = await SendPredictionRequest(imageFile);
    return Ok(JsonConvert.SerializeObject(prediction));
}
```

Run the API by pressing **F5**, browse to the frontend site and take a picture!

![](../Images/2-13-finish.png)

## Optional work

There are several optional tasks you can entertain yourself with:

* More gestures can be added and trained.
* Any errors coming from the Custom Vision API should be handled properly.
* Configuration (API key and URL) shoud be taken out of the code into configuration.
* API can be Dockerized.