// Video Tools Imports
import GIFToAVIGUI from '../../tool-ui/gif/GIFToAVIGUI';
import GIFToBase64GUI from '../../tool-ui/gif/GIFToBase64GUI';
import GIFToHTMLGUI from '../../tool-ui/gif/GIFToHTMLGUI';
import GIFToJPGGUI from '../../tool-ui/gif/GIFToJPGGUI';
import GIFToMOVGUI from '../../tool-ui/gif/GIFToMOVGUI';
import GIFToMP4GUI from '../../tool-ui/gif/GIFToMP4GUI';
import GIFToPDFGUI from '../../tool-ui/gif/GIFToPDFGUI';
import GIFToPNGGUI from '../../tool-ui/gif/GIFToPNGGUI';
import GIFToWEBMGUI from '../../tool-ui/gif/GIFToWEBMGUI';
import GIFToWEBPGUI from '../../tool-ui/gif/GIFToWEBPGUI';
import AVIToGIFGUI from '../../tool-ui/video/AVIToGIFGUI';
import AVIToH264GUI from '../../tool-ui/video/AVIToH264GUI';
import AVIToJPGUI from '../../tool-ui/video/AVIToJPGUI';
import AVIToMKVGUI from '../../tool-ui/video/AVIToMKVGUI';
import AVIToMOVGUI from '../../tool-ui/video/AVIToMOVGUI';
import AVIToMP3GUI from '../../tool-ui/video/AVIToMP3GUI';
import AVIToMP4GUI from '../../tool-ui/video/AVIToMP4GUI';
import AVIToMPEGUI from '../../tool-ui/video/AVIToMPEGUI';
import AVIToMPFGUI from '../../tool-ui/video/AVIToMPFGUI';
import AVIToPNGGUI from '../../tool-ui/video/AVIToPNGGUI';
import AVIToWAVGUI from '../../tool-ui/video/AVIToWAVGUI';
import AVIToWEBMGUI from '../../tool-ui/video/AVIToWEBMGUI';
import MOVToAVIGUI from '../../tool-ui/video/MOVToAVIGUI';
import MOVToGIFGUI from '../../tool-ui/video/MOVToGIFGUI';
import MOVToJPGGUI from '../../tool-ui/video/MOVToJPGGUI';
import MOVToMP3GUI from '../../tool-ui/video/MOVToMP3GUI';
import MOVToMP4GUI from '../../tool-ui/video/MOVToMP4GUI';
import MOVToPDFGUI from '../../tool-ui/video/MOVToPDFGUI';
import MOVToPNGGUI from '../../tool-ui/video/MOVToPNGGUI';
import MOVToWAVGUI from '../../tool-ui/video/MOVToWAVGUI';
import MOVToWEBMGUI from '../../tool-ui/video/MOVToWEBMGUI';
import MP4ToAVIGUI from '../../tool-ui/video/MP4ToAVIGUI';
import MP4ToGIFGUI from '../../tool-ui/video/MP4ToGIFGUI';
import MP4ToJPGGUI from '../../tool-ui/video/MP4ToJPGGUI';
import MP4ToMOVGUI from '../../tool-ui/video/MP4ToMOVGUI';
import MP4ToMP3GUI from '../../tool-ui/video/MP4ToMP3GUI';
import MP4ToPNGGUI from '../../tool-ui/video/MP4ToPNGGUI';
import MP4ToWEBMGUI from '../../tool-ui/video/MP4ToWEBMGUI';
import WEBMToAVIGUI from '../../tool-ui/video/WEBMToAVIGUI';
import WEBMToGIFGUI from '../../tool-ui/video/WEBMToGIFGUI';
import WEBMToJPGGUI from '../../tool-ui/video/WEBMToJPGGUI';
import WEBMToMOVGUI from '../../tool-ui/video/WEBMToMOVGUI';
import WEBMToMP3GUI from '../../tool-ui/video/WEBMToMP3GUI';
import WEBMToMP4GUI from '../../tool-ui/video/WEBMToMP4GUI';
import WEBMToPNGGUI from '../../tool-ui/video/WEBMToPNGGUI';
import WEBMToWAVGUI from '../../tool-ui/video/WEBMToWAVGUI';

// Image & Doc Tools Imports
import ConversionPanel from '../../tool-ui/image/ConversionPanel';
import DocToolWrapper from '../../tool-ui/doc/DocToolWrapper';
import { categories as imageCategories } from '../configs/imageData';
import { categories as docCategories } from '../configs/docData';
import { audioCategories } from '../configs/audioData';

const videoMap = {
  'GIF To AVI': GIFToAVIGUI,
  'GIF To BASE64': GIFToBase64GUI,
  'GIF To HTML': GIFToHTMLGUI,
  'GIF To JPG': GIFToJPGGUI,
  'GIF To MOV': GIFToMOVGUI,
  'GIF To MP4': GIFToMP4GUI,
  'GIF To PDF': GIFToPDFGUI,
  'GIF To PNG': GIFToPNGGUI,
  'GIF To WEBM': GIFToWEBMGUI,
  'GIF To WEBP': GIFToWEBPGUI,
  'AVI To GIF': AVIToGIFGUI,
  'AVI To H264': AVIToH264GUI,
  'AVI To JPG': AVIToJPGUI,
  'AVI To MKV': AVIToMKVGUI,
  'AVI To MOV': AVIToMOVGUI,
  'AVI To MP3': AVIToMP3GUI,
  'AVI To MP4': AVIToMP4GUI,
  'AVI To MPE': AVIToMPEGUI,
  'AVI To MPF': AVIToMPFGUI,
  'AVI To PNG': AVIToPNGGUI,
  'AVI To WAV': AVIToWAVGUI,
  'AVI To WEBM': AVIToWEBMGUI,
  'MOV To AVI': MOVToAVIGUI,
  'MOV To GIF': MOVToGIFGUI,
  'MOV To JPG': MOVToJPGGUI,
  'MOV To MP3': MOVToMP3GUI,
  'MOV To MP4': MOVToMP4GUI,
  'MOV To PDF': MOVToPDFGUI,
  'MOV To PNG': MOVToPNGGUI,
  'MOV To WAV': MOVToWAVGUI,
  'MOV To WEBM': MOVToWEBMGUI,
  'MP4 To AVI': MP4ToAVIGUI,
  'MP4 To GIF': MP4ToGIFGUI,
  'MP4 To JPG': MP4ToJPGGUI,
  'MP4 To MOV': MP4ToMOVGUI,
  'MP4 To MP3': MP4ToMP3GUI,
  'MP4 To PNG': MP4ToPNGGUI,
  'MP4 To WEBM': MP4ToWEBMGUI,
  'WEBM To AVI': WEBMToAVIGUI,
  'WEBM To GIF': WEBMToGIFGUI,
  'WEBM To JPG': WEBMToJPGGUI,
  'WEBM To MOV': WEBMToMOVGUI,
  'WEBM To MP3': WEBMToMP3GUI,
  'WEBM To MP4': WEBMToMP4GUI,
  'WEBM To PNG': WEBMToPNGGUI,
  'WEBM To WAV': WEBMToWAVGUI,
};

// Generate map for image tools
const imageMap = {};
if (imageCategories && imageCategories['图片类']) {
    imageCategories['图片类'].forEach(cat => {
      cat.tools.forEach(tool => {
        imageMap[tool.name] = ConversionPanel;
      });
    });
}

// Generate map for doc tools
const docMap = {};
if (docCategories && docCategories['主要功能']) {
    docCategories['主要功能'].forEach(cat => {
      cat.tools.forEach(tool => {
        docMap[tool.name] = DocToolWrapper;
      });
    });
}

// Generate map for audio tools
const audioMap = {};
if (audioCategories) {
    audioCategories.forEach(cat => {
      if (cat.tools) {
        cat.tools.forEach(tool => {
          audioMap[tool.name] = ConversionPanel;
        });
      }
    });
}

export const componentMap = {
  ...videoMap,
  ...imageMap,
  ...docMap,
  ...audioMap
};
