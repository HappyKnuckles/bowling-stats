import { Injectable } from '@angular/core';
import { BlobServiceClient } from "@azure/storage-blob";
import { environment } from 'src/environments/environment';

const ComputerVisionClient = require('@azure/cognitiveservices-computervision').ComputerVisionClient;
const ApiKeyCredentials = require('@azure/ms-rest-js').ApiKeyCredentials;

@Injectable({
  providedIn: 'root'
})
export class ImageProcesserService {
  subKey: string = environment.key;
  endPointUrl: string =environment.endPoint;
  computerVisionClient = new ComputerVisionClient(
    new ApiKeyCredentials({ inHeader: { 'Ocp-Apim-Subscription-Key': this.subKey } }), this.endPointUrl);
  sasUrl: string = environment.sasUrl
  url: string = environment.imagesUrl;
  imageUrl: any;
  constructor() { }

  async performOCR(image: File) {
    const imageUrl = await this.uploadImageToStorage(image);
    try {
      const printedResult = await this.readTextFromURL(imageUrl);
      const extractedText = this.printRecognizedText(printedResult);
      // Delete the blob after extraction
      return extractedText;
    } catch (error) {
      console.error('Error performing OCR:', error);
      return;
    }
  }

  async readTextFromURL(url: string) {
    let result = await this.computerVisionClient.read(url);
    let operation = result.operationLocation.split('/').slice(-1)[0];

    // Continuously check the status until it succeeds
    while (result.status !== "succeeded") {
      await this.sleep(1000); // Sleep for 1 second
      result = await this.computerVisionClient.getReadResult(operation);
    }

    return result.analyzeResult.readResults;
  }

  sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  printRecognizedText(readResults: any[]): string {
    console.log('Recognized text:');
    let recognizedText = ''; // Variable to store the recognized text
    for (const page in readResults) {
      if (readResults.length > 1) {
        recognizedText += `==== Page: ${page}\n`;
      }
      const result = readResults[page];
      if (result.lines.length) {
        for (const line of result.lines) {
          const lineText = line.words.map((w: { text: any; }) => w.text).join(' ');
          if (lineText.toLowerCase().includes('player')) {
            return recognizedText; // Exit and return the recognized text
          }
          // if (startPrinting) {
            recognizedText += lineText + '\n'; // Append line text to recognized text
          // }
          // if (lineText.toLowerCase().includes('tot')) {
          //   startPrinting = true; // Set the flag to start printing
          // }
        }
      } else {
        console.log('No recognized text.\n');
      }
    }
    return recognizedText; // Return the recognized text
  }

  async uploadImageToStorage(imageFile: File): Promise<string> {
    try {
      const blobServiceClient = new BlobServiceClient(this.sasUrl);
      const containerClient = blobServiceClient.getContainerClient("images");
      const blobName = imageFile.name;
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);
      await blockBlobClient.uploadBrowserData(imageFile);
      this.imageUrl = this.url + imageFile.name;
      console.log(this.imageUrl)
      return this.imageUrl;
    } catch (error) {
      console.error("Error uploading image:", error);
      throw error;
    }
  }
}


