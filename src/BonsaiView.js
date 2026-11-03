import React, { useEffect, useRef, useState } from 'react';
import { WebView } from 'react-native-webview';
import { BONSAI_HTML } from './bonsaiHtml';

// Shows the 3D bonsai. Props:
//   climate : { condition, temp, wind, mood }  (sent to the tree whenever it changes)
//   onDone  : called once when the growth animation has finished
export default function BonsaiView({ climate, onDone }) {
  const ref = useRef(null);
  const [ready, setReady] = useState(false);
  const payload = JSON.stringify(climate);

  useEffect(() => {
    if (ready && ref.current) {
      ref.current.injectJavaScript('window.setClimate(' + payload + '); true;');
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
      ref={ref}
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
}