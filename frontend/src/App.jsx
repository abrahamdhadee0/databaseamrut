import { useState, useRef, useEffect } from 'react';
import './App.css';

function App() {
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState(null);
  const [chatHistory, setChatHistory] = useState([
    { role: 'ai', content: "Hello! I am AMRUT DATA AI. Upload files and ask questions. Your files stay loaded until you clear them." }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoadedFiles, setHasLoadedFiles] = useState(false);
  const chatEndRef = useRef(null);

  // Load fonts on component mount
  useEffect(() => {
    const fontLink = document.createElement('link');
    fontLink.href = 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@300;400;600&family=Cormorant+Garamond:wght@300;400;600&display=swap';
    fontLink.rel = 'stylesheet';
    document.head.appendChild(fontLink);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFiles(e.target.files);
      console.log("✅ Files selected:", e.target.files.length);
    }
  };

  const clearFiles = async () => {
    try {
      await fetch("http://localhost:8000/clear", { method: "POST" });
      setHasLoadedFiles(false);
      setChatHistory(prev => [...prev, {
        role: 'ai',
        content: "✅ All files cleared. Upload new files to analyze."
      }]);
    } catch (error) {
      console.error("Error clearing files:", error);
    }
  };

  const sendMessage = async () => {
    if (!message.trim() && !files) {
      console.log("⚠️ No message or files to send");
      return;
    }

    setIsLoading(true);
    const userText = message || "Analyze these files";
    const currentFiles = files;

    console.log("📤 Preparing to send:");
    console.log("   Message:", userText);
    console.log("   Files:", currentFiles ? currentFiles.length : 0);

    // UI Update
    let displayMsg = userText;
    if (currentFiles) {
      displayMsg += ` 📎 [${currentFiles.length} file(s)]`;
      setHasLoadedFiles(true);
    }

    setChatHistory(prev => [...prev, { role: 'user', content: displayMsg }]);

    // Backend Request - BUILD FORMDATA BEFORE CLEARING STATE
    const formData = new FormData();
    formData.append("message", userText);

    if (currentFiles && currentFiles.length > 0) {
      console.log("📎 Adding files to FormData:");
      for (let i = 0; i < currentFiles.length; i++) {
        formData.append("files", currentFiles[i]);
        console.log(`   ✅ File ${i + 1}: ${currentFiles[i].name} (${currentFiles[i].size} bytes)`);
      }
    } else {
      console.log("⚠️ No files to attach");
    }

    // NOW clear the UI state AFTER FormData is built
    setMessage("");
    setFiles(null);
    const fileInput = document.getElementById("file-upload");
    if (fileInput) fileInput.value = "";

    try {
      console.log("🚀 Sending request to backend...");
      const res = await fetch("http://localhost:8000/chat", {
        method: "POST",
        body: formData,
      });

      console.log("📥 Response status:", res.status);

      if (!res.ok) throw new Error("Server Error");

      const data = await res.json();
      console.log("✅ Response received:", data);
      setChatHistory(prev => [...prev, { role: 'ai', content: data.reply }]);

    } catch (error) {
      console.error("❌ Error:", error);
      setChatHistory(prev => [...prev, { role: 'ai', content: `⚠️ Error: ${error.message}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="app-container">
      <header>
        <h1>AMRUT DATA AI</h1>
        {hasLoadedFiles && (
          <button onClick={clearFiles}>
            Clear Files
          </button>
        )}
      </header>

      <div className="chat-box">
        {chatHistory.map((msg, index) => (
          <div key={index} className={`message ${msg.role}`}>
            <div className="avatar">{msg.role === 'ai' ? '🤖' : '👤'}</div>
            <div className="bubble" style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>
          </div>
        ))}
        {isLoading && (
          <div className="message ai">
            <div className="avatar">🤖</div>
            <div className="bubble">Analyzing...</div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <div className="input-area">
        <div className="input-wrapper">
          <div className="input-controls">
            <label htmlFor="file-upload" className="file-upload-label">
              <span style={{fontSize: '1.2rem', marginRight: '5px'}}>+</span>
              {files ? `${files.length} file(s) ready` : "Upload Files"}
            </label>
            <input
              id="file-upload"
              type="file"
              multiple
              accept=".pdf,.docx,.doc,.xlsx,.xls,.csv,.pptx"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
          </div>
          <div className="input-row">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={hasLoadedFiles ? "Ask about your files..." : "Upload files first..."}
              rows="1"
            />
            <button
              className="send-btn"
              onClick={sendMessage}
              disabled={isLoading}
            >
              ➤
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;