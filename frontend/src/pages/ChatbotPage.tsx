import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  Trash2,
  RefreshCw,
  Database,
  ArrowRight,
  TrendingUp,
  FileSpreadsheet,
  BarChart3,
  Lightbulb
} from 'lucide-react';
import { useDataset } from '../context/DatasetContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { ChatMessage } from '../types';
import { DynamicChart } from '../charts/DynamicChart';

export const ChatbotPage: React.FC = () => {
  const { user } = useAuth();
  const { activeDataset, activeOverview } = useDataset();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState<string>('');
  const [isSending, setIsSending] = useState<boolean>(false);
  const [conversationId, setConversationId] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize or fetch history for active dataset
  useEffect(() => {
    if (!activeDataset || !user) return;
    const convId = `conv-${activeDataset.id}-${user.id}`;
    setConversationId(convId);

    const loadHistory = async () => {
      try {
        const history = await api.getChatHistory(activeDataset.id, convId);
        if (history && history.length > 0) {
          setMessages(history);
        } else {
          // Initial greeting tailored to this active dataset
          const initialGreeting: ChatMessage = {
            id: 'init-msg',
            conversation_id: convId,
            dataset_id: activeDataset.id,
            user_message: '',
            reply: `Hello ${user.name.split(' ')[0]}! I am your **Dataset Intelligence Agent**.\n\nI have loaded **${activeDataset.name}** (${activeDataset.row_count.toLocaleString()} rows, ${activeDataset.col_count} columns).\n\nAsk me anything in natural English—averages, top performers, distributions, correlation, or ask me to generate a chart. All calculations run dynamically on your dataset with **zero external AI costs**!`,
            intent: 'greeting',
            suggested_followups: [
              'What is this dataset about?',
              'How many rows and columns are present?',
              'Are there missing values or duplicates?',
              'Show the first 5 records',
              'Suggest useful visualizations'
            ],
            created_at: new Date().toISOString()
          };
          setMessages([initialGreeting]);
        }
      } catch (err) {
        console.error('Failed to load chat history:', err);
      }
    };
    loadHistory();
  }, [activeDataset?.id, user?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  const handleSendMessage = async (queryText?: string) => {
    const textToSend = queryText || inputText;
    if (!textToSend.trim() || !activeDataset || isSending) return;

    const userMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      conversation_id: conversationId,
      dataset_id: activeDataset.id,
      user_message: textToSend,
      reply: '',
      created_at: new Date().toISOString()
    };

    // Optimistically update
    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsSending(true);

    try {
      const resp = await api.sendChatMessage(activeDataset.id, textToSend, conversationId);
      // Replace temp with real response
      setMessages((prev) => [...prev.slice(0, prev.length - 1), resp]);
    } catch (err: any) {
      const errMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        conversation_id: conversationId,
        dataset_id: activeDataset.id,
        user_message: textToSend,
        reply: `⚠️ Error executing dataset query: ${err.message || 'Could not process calculation.'}`,
        created_at: new Date().toISOString()
      };
      setMessages((prev) => [...prev.slice(0, prev.length - 1), errMsg]);
    } finally {
      setIsSending(false);
    }
  };

  const handleClearHistory = async () => {
    if (!activeDataset) return;
    if (window.confirm('Clear all conversation history for this dataset?')) {
      await api.clearChatHistory(activeDataset.id, conversationId);
      setMessages([]);
    }
  };

  if (!activeDataset) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
        <Bot className="w-10 h-10 text-slate-600 mx-auto mb-3" />
        <h3 className="text-base font-bold text-white">No Dataset Selected</h3>
        <p className="text-xs text-slate-400 mt-1">
          Select or upload a dataset to start interacting with the AI Chatbot.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)] max-w-5xl mx-auto space-y-4">
      {/* Chat Header Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl px-5 py-3 flex items-center justify-between shrink-0 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary-500 to-accent-500 flex items-center justify-center text-white shadow">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-bold text-white">Dataset Intelligence Agent</h3>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.2 rounded font-semibold">
                Pandas Engine (₹0)
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">
              Active: {activeDataset.name} ({activeDataset.row_count.toLocaleString()} rows • {activeDataset.col_count} cols)
            </p>
          </div>
        </div>

        <button
          onClick={handleClearHistory}
          className="text-slate-400 hover:text-rose-400 text-xs px-2.5 py-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 transition flex items-center space-x-1"
          title="Clear Conversation"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Clear Chat</span>
        </button>
      </div>

      {/* Message Stream */}
      <div className="flex-1 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 sm:p-6 overflow-y-auto space-y-5 shadow-inner">
        {messages.map((msg, idx) => (
          <div key={msg.id || idx} className="space-y-3">
            {/* User Bubble (if message has query) */}
            {msg.user_message && (
              <div className="flex justify-end">
                <div className="bg-primary-600 text-white rounded-2xl rounded-tr-sm px-4 py-2.5 max-w-[80%] text-xs font-medium shadow-md">
                  {msg.user_message}
                </div>
              </div>
            )}

            {/* Agent Bubble */}
            {msg.reply && (
              <div className="flex items-start space-x-3 max-w-[90%] sm:max-w-[85%]">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary-600 to-accent-600 flex items-center justify-center text-white shrink-0 mt-0.5 shadow">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-2xl rounded-tl-sm p-4 space-y-3 text-xs text-slate-200 shadow-md">
                  {/* Markdown formatted text */}
                  <div className="whitespace-pre-line leading-relaxed space-y-2">
                    {msg.reply}
                  </div>

                  {/* Inline Table Data Preview */}
                  {msg.table_data && msg.table_data.length > 0 && (
                    <div className="overflow-x-auto border border-slate-800 rounded-lg mt-3 bg-slate-950">
                      <table className="w-full text-[11px] text-left">
                        <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800">
                          <tr>
                            {Object.keys(msg.table_data[0]).slice(0, 6).map((col) => (
                              <th key={col} className="p-2 font-semibold whitespace-nowrap">
                                {col}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800 font-mono">
                          {msg.table_data.map((row, rIdx) => (
                            <tr key={rIdx} className="hover:bg-slate-800/30">
                              {Object.keys(msg.table_data![0]).slice(0, 6).map((col) => (
                                <td key={col} className="p-2 whitespace-nowrap text-slate-300">
                                  {String(row[col] ?? '')}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Inline Interactive Recharts Graph */}
                  {msg.chart && (
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 mt-3 shadow-inner">
                      <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
                        <span className="text-xs font-bold text-white flex items-center gap-1.5">
                          <BarChart3 className="w-4 h-4 text-primary-400" />
                          <span>{msg.chart.title}</span>
                        </span>
                        <span className="text-[10px] font-mono uppercase bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">
                          {msg.chart.chart_type}
                        </span>
                      </div>
                      <DynamicChart
                        chartType={msg.chart.chart_type}
                        data={msg.chart.data}
                        xAxis={msg.chart.x_axis}
                        yAxis={msg.chart.y_axis}
                        height={240}
                      />
                    </div>
                  )}

                  {/* Follow-up question chips */}
                  {msg.suggested_followups && msg.suggested_followups.length > 0 && (
                    <div className="pt-2 border-t border-slate-800/80 flex flex-wrap gap-1.5">
                      <span className="text-[10px] font-semibold text-slate-500 uppercase flex items-center gap-1 mr-1">
                        <Lightbulb className="w-3 h-3 text-amber-400" /> Suggestions:
                      </span>
                      {msg.suggested_followups.map((sug, sIdx) => (
                        <button
                          key={sIdx}
                          onClick={() => handleSendMessage(sug)}
                          className="text-[11px] bg-slate-800/80 hover:bg-slate-750 text-slate-300 hover:text-white px-2.5 py-1 rounded-full border border-slate-700 transition flex items-center gap-1"
                        >
                          <span>{sug}</span>
                          <ArrowRight className="w-2.5 h-2.5 text-slate-500" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}

        {isSending && (
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center text-white shrink-0 mt-0.5">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl rounded-tl-sm p-4 text-xs text-slate-400 flex items-center space-x-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-primary-400" />
              <span>Analyzing dataset with Pandas engine...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="bg-slate-900 border border-slate-800 rounded-2xl p-2.5 flex items-center space-x-2 shadow-lg shrink-0"
      >
        <input
          type="text"
          placeholder="Ask anything about this dataset (e.g. 'What is the average revenue?', 'Top 5 by sales', 'Plot bar chart')..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          className="flex-1 bg-transparent px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={!inputText.trim() || isSending}
          className="bg-primary-600 hover:bg-primary-500 disabled:opacity-40 text-white p-2 rounded-xl transition shadow"
          title="Send query"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};

