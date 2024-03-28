import { Injectable } from '@angular/core';
import { BlobServiceClient, ContainerClient } from "@azure/storage-blob";
import { environment } from 'src/environments/environment';

const ComputerVisionClient = require('@azure/cognitiveservices-computervision').ComputerVisionClient;
const ApiKeyCredentials = require('@azure/ms-rest-js').ApiKeyCredentials;

@Injectable({
  providedIn: 'root'
})
export class ImageProcesserService {
  subKey: string = environment.key;
  endPointUrl: string = environment.endPoint;
  computerVisionClient = new ComputerVisionClient(
    new ApiKeyCredentials({ inHeader: { 'Ocp-Apim-Subscription-Key': this.subKey } }), this.endPointUrl);
  sasUrl: string = environment.sasUrl
  url: string = environment.imagesUrl;
  containerClient: ContainerClient;
  imageUrl: any;

  constructor() {
    const blobServiceClient = new BlobServiceClient(this.sasUrl);
    this.containerClient = blobServiceClient.getContainerClient("images");
  }

  async performOCR(image: File) {
    const imageUrl = await this.uploadImageToStorage(image);
    try {
      const printedResult = await this.readTextFromURL(imageUrl);
      const extractedText = this.printRecognizedText(printedResult);
      await this.deleteImageFromStorage(imageUrl);
      return extractedText;
    } catch (error) {
      throw error;
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
    let recognizedText = ''; // Variable to store the recognized text
    try {
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
            recognizedText += lineText + '\n'; // Append line text to recognized text
          }
        } else {
          throw new Error('No recognized text');
        }
      }
    } catch (error) {
      throw new Error('Error while processing recognized text: ' + error);
    }
    return recognizedText; // Return the recognized text
  }
  

  async uploadImageToStorage(imageFile: File): Promise<string> {
    try {
      const blobName = 'bowling' + Date.now().toString();
      const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
      await blockBlobClient.uploadBrowserData(imageFile);
      this.imageUrl = this.url + blobName;
      return this.imageUrl;
    } catch (error) {
      throw error;
    }
  }

  async deleteImageFromStorage(imageUrl: string): Promise<void> {
    try {
      const blobName = imageUrl.substring(this.url.length); // Extract blob name from the URL
      const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
      await blockBlobClient.delete();
    } catch (error) {
      throw error;
    }
  }
}


