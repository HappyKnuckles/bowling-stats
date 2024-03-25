import { Injectable } from '@angular/core';
import { BlobServiceClient } from "@azure/storage-blob";

const ComputerVisionClient = require('@azure/cognitiveservices-computervision').ComputerVisionClient;
const ApiKeyCredentials = require('@azure/ms-rest-js').ApiKeyCredentials;

@Injectable({
  providedIn: 'root'
})
export class ImageProcesserService {
  subKey: string = "401521a17e39486a8837f6b31c265f56";
  endPointUrl: string = "https://happyknuckles.cognitiveservices.azure.com/";
  computerVisionClient = new ComputerVisionClient(
    new ApiKeyCredentials({ inHeader: { 'Ocp-Apim-Subscription-Key': this.subKey } }), this.endPointUrl);
  sasUrl = "https://happyknucklesimages.blob.core.windows.net/?sv=2022-11-02&ss=bfqt&srt=sco&sp=rwdlacupiytfx&se=2029-03-23T23:59:30Z&st=2024-03-23T15:59:30Z&spr=https&sig=7z6AssmXSPNU%2BdsZPDHd1ml9IlpxTCIOoxzFaLmtLwg%3D"
  url = "https://happyknucklesimages.blob.core.windows.net/images/";
  imageUrl: any;
  constructor() { }

  async performOCR(image: File) {
    const imageUrl = await this.uploadImageToStorage(image);
    try {
      const printedResult = await this.readTextFromURL(imageUrl);
      const extractedText = this.printRecognizedText(printedResult);
      // Delete the blob after extraction
      console.log(extractedText)
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


