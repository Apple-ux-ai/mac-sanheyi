import { 
  AudioOutlined,
  PlaySquareOutlined,
  FileOutlined
} from '@ant-design/icons';

export const audioCategories = [
    {
      name: 'MP3 转换器',
      icon: AudioOutlined,
      description: 'MP3 音频转换工具集',
      tools: [
        { name: 'MP3 To MP4', icon: PlaySquareOutlined, description: 'Convert MP3 to MP4' },
        { name: 'MP3 To WAV', icon: FileOutlined, description: 'Convert MP3 to WAV' },
        { name: 'MP3 To OGG', icon: FileOutlined, description: 'Convert MP3 to OGG' },
        { name: 'MP3 To M4A', icon: FileOutlined, description: 'Convert MP3 to M4A' },
        { name: 'MP3 To M4R', icon: FileOutlined, description: 'Convert MP3 to M4R' },
        { name: 'MP3 To FLAC', icon: FileOutlined, description: 'Convert MP3 to FLAC' },
        { name: 'MP3 To MOV', icon: PlaySquareOutlined, description: 'Convert MP3 to MOV' },
        { name: 'MP3 To AAC', icon: FileOutlined, description: 'Convert MP3 to AAC' },
        { name: 'MP3 To OPUS', icon: FileOutlined, description: 'Convert MP3 to OPUS' }
      ]
    }
];
