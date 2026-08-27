import { useEffect, useRef, useState } from 'react';
import type { ComprehensionQuestion } from '../../shared/contracts';

type SpeechResult = ArrayLike<{ transcript: string }> & { isFinal: boolean };
type SpeechResultEvent = Event & {
  resultIndex: number;
  results: ArrayLike<SpeechResult>;
};
type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: Event) => void) | null;
  onerror: ((event: Event) => void) | null;
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

  /**
   * The recognition instance has to outlive the click that made it, or the
   * stop button has nothing to stop. Previously it was a local, so pressing
   * stop only flipped the label — the microphone stayed live.
   */
  const recognition = useRef<SpeechRecognitionLike | null>(null);
  /** Everything committed so far: typed text plus finalised speech. */
  const committed = useRef('');

  // Never leave the microphone running because the panel closed.
  useEffect(() => () => recognition.current?.abort(), []);

  const stopListening = () => {
    recognition.current?.stop();
    recognition.current = null;
    setListening(false);
  };

  const toggleMicrophone = () => {
    if (listening) {
      stopListening();
      setMicMessage('');
      return;
    }

    const speechWindow = window as Window & {
      SpeechRecognition?: SpeechRecognitionConstructor;
      webkitSpeechRecognition?: SpeechRecognitionConstructor;
    };
    const Recognition = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
    if (!Recognition) {
      setMicMessage('Voice input is not supported in this browser.');
      return;
    }

    const r = new Recognition();
    r.continuous = true;
    r.interimResults = true;
    r.lang = 'en-US';

    committed.current = text;

    /**
     * Only results from `resultIndex` onward are new, and only `isFinal` ones
     * are settled. The previous version re-read the whole results array every
     * event and appended it to the existing text, so a sentence arrived half a
     * dozen times over.
     */
    r.onresult = (event) => {
      const e = event as SpeechResultEvent;
      let settled = '';
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i += 1) {
        const result = e.results[i];
        if (result.isFinal) settled += result[0].transcript;
        else interim += result[0].transcript;
      }
      if (settled) committed.current = `${committed.current} ${settled}`.trim();
      setText(`${committed.current} ${interim}`.trim());
    };

    r.onerror = (event) => {
      const code = (event as Event & { error?: string }).error;
      setMicMessage(
        code === 'not-allowed'
          ? 'Chrome blocked the microphone. Allow it for this extension and try again.'
          : code === 'no-speech'
            ? "I didn't catch anything — try again a bit closer to the mic."
            : 'Something went wrong with the microphone.',
      );
      stopListening();
    };

    r.onend = () => setListening(false);

    recognition.current = r;
    setMicMessage('Listening. Talk through your thinking.');
    setListening(true);
    r.start();
  };

  const submit = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    if (listening) stopListening();
    onSubmit(trimmed);
    setText('');
    committed.current = '';
    setMicMessage('');
  };

  return (
    <div className="sn-input">
      <div className="sn-input-label">
        <span>{question ? 'Your answer' : 'Your turn'}</span>
        <span>AI will respond</span>
      </div>

      {question && <p className="sn-question">{question.prompt}</p>}

      <div className="sn-composer">
        <textarea
          value={text}
          disabled={disabled}
          rows={4}
          placeholder={
            question ? 'Answer in a sentence…' : 'Describe your approach in plain English…'
          }
          onChange={(e) => {
            setText(e.target.value);
            committed.current = e.target.value;
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit();
          }}
        />
        <button
          type="button"
          className={`sn-mic ${listening ? 'is-listening' : ''}`}
          aria-label={listening ? 'Stop dictating' : 'Dictate your answer'}
          aria-pressed={listening}
          title={listening ? 'Stop dictating' : 'Dictate your answer'}
          onClick={toggleMicrophone}
          disabled={disabled}
        >
          {listening ? '■' : '🎙'}
        </button>
      </div>

      {micMessage && (
        <p className={`sn-mic-message ${listening ? 'is-listening' : ''}`} role="status">
          {micMessage}
        </p>
      )}

      <button type="button" className="sn-primary" disabled={disabled} onClick={submit}>
        {question ? 'Send answer to AI coach' : 'Talk it through with AI'}
      </button>
    </div>
  );
}
