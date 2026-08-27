import { useEffect, useState } from 'react';
import type { ComprehensionQuestion } from '../../shared/contracts';

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((event: Event) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
};
type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

/** B1 + B5 — same box, different prompt when a comprehension question is live. */
export function ExplanationInput({
  question,
  disabled,
  onSubmit,
}: {
  question: ComprehensionQuestion | null;
  disabled: boolean;
  onSubmit: (text: string) => void;
}) {
  const [text, setText] = useState('');
  const [listening, setListening] = useState(false);
  const [micMessage, setMicMessage] = useState('');

  useEffect(() => () => setListening(false), []);

  const toggleMicrophone = () => {
    const speechWindow = window as Window & {
      SpeechRecognition?: SpeechRecognitionConstructor;
      webkitSpeechRecognition?: SpeechRecognitionConstructor;
    };
    const Recognition = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
    if (!Recognition) {
      setMicMessage('Voice input is not supported in this browser.');
      return;
    }
    if (listening) {
      setListening(false);
      return;
    }
    const recognition = new Recognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.onresult = (event) => {
      const results = (event as Event & { results: ArrayLike<ArrayLike<{ transcript: string }>> }).results;
      let transcript = '';
      for (let i = 0; i < results.length; i += 1) transcript += results[i][0].transcript;
      setText((current) => `${current.replace(/\s+$/, '')} ${transcript}`.trim());
    };
    recognition.onerror = () => {
      setListening(false);
      setMicMessage('I could not hear that. Check microphone access and try again.');
    };
    recognition.onend = () => setListening(false);
    setMicMessage('Microphone on. Talk through your thinking.');
    setListening(true);
    recognition.start();
  };

  const submit = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
    setText('');
  };

  return (
    <div className="sn-input sn-input--preview">
      <div className="sn-input-label"><span>{question ? 'Your answer' : 'Your turn'}</span><span>AI will respond</span></div>
      {question && <p className="sn-question">{question.prompt}</p>}
      <div className="sn-composer">
        <textarea value={text} disabled={disabled} rows={4} placeholder={question ? 'Answer in a sentence…' : 'Describe your approach in plain English…'} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit(); }} />
        <button type="button" className={`sn-mic ${listening ? 'is-listening' : ''}`} aria-label={listening ? 'Stop microphone' : 'Use microphone'} title={listening ? 'Stop microphone' : 'Use microphone'} onClick={toggleMicrophone} disabled={disabled}>{listening ? '■' : '●'}</button>
      </div>
      {micMessage && <p className={`sn-mic-message ${listening ? 'is-listening' : ''}`} role="status">{micMessage}</p>}
      <button type="button" className="sn-primary" disabled={disabled} onClick={submit}>
        {question ? 'Send answer to AI coach' : 'Talk it through with AI'}
      </button>
    </div>
  );
}
