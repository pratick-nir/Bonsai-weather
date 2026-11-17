import React, { useEffect, useImperativeHandle, useRef, useState } from 'react';
import { WebView } from 'react-native-webview';
import { BONSAI_HTML } from './bonsaiHtml';

// Shows the 3D bonsai. Props:
//   climate : { condition, temp, wind, mood, growth }  (sent to the tree whenever it changes)
//   onDone  : called once when the growth animation has finished
// Ref methods (call via ref.current):
//   reset()           – replay grow animation from seed
//   setStage(day)     – freeze tree at day 0-6 growth stage
//   clearStage()      – unfreeze, resume live animation
const BonsaiView = React.forwardRef(function BonsaiView({ climate, onDone }, ref) {
  const webRef = useRef(null);
  const [ready, setReady] = useState(false);
  const payload = JSON.stringify(climate);

  useImperativeHandle(ref, () => ({
    reset:      () => webRef.current?.injectJavaScript('window.resetTree();true;'),
    setStage:   (day) => webRef.current?.injectJavaScript('window.setTreeStage(' + day + ');true;'),
    clearStage: () => webRef.current?.injectJavaScript('window.clearTreeStage();true;'),
  }));

  useEffect(() => {
    if (ready && webRef.current) {
      webRef.current.injectJavaScript('window.setClimate(' + payload + '); true;');
    }
  }, [ready, payload]);

  const onMessage = (e) => {
    try {
      const msg = JSON.parse(e.nativeEvent.data);
      if (msg.type === 'ready') setReady(true);
      if (msg.type === 'done' && onDone) onDone();
    } catch (err) {}
  };

  return (
    <WebView
      ref={webRef}
      source={{ html: BONSAI_HTML }}
      originWhitelist={['*']}
      onMessage={onMessage}
      javaScriptEnabled
      scrollEnabled={false}
      bounces={false}
      overScrollMode="never"
      androidLayerType="hardware"
      style={{ backgroundColor: 'transparent' }}
      containerStyle={{ backgroundColor: 'transparent' }}
    />
  );
});

export default BonsaiView;
