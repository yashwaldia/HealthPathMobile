// types/react-native-view-shot.d.ts
declare module 'react-native-view-shot' {
  import { Component, RefObject } from 'react';
  import { ViewProps } from 'react-native';

  export interface CaptureOptions {
    format?: 'png' | 'jpg' | 'jpeg' | 'webm' | 'raw';
    quality?: number;
    width?: number;
    height?: number;
    result?: 'tmpfile' | 'base64' | 'data-uri' | 'zip-base64';
    snapshotContentContainer?: boolean;
  }

  export function captureRef<T = any>(
    view: RefObject<T> | T | number,
    options?: CaptureOptions
  ): Promise<string>;

  export function releaseCapture(uri: string): void;

  export interface ViewShotProps extends ViewProps {
    options?: CaptureOptions;
    captureMode?: 'mount' | 'continuous' | 'update';
    onCapture?: (uri: string) => void;
    onCaptureFailure?: (error: Error) => void;
  }

  export default class ViewShot extends Component<ViewShotProps> {
    capture(): Promise<string>;
  }
}
