"use client";

import React, { useCallback, useRef, useState } from "react";
import { useAppStore, type Resume } from "@/lib/store";

function Spinner() {
  return (
    <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

function UploadIcon({ className }: { className: string }) {
  return (
    <svg className={className} width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="text-green-500" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function ErrorIcon() {
  return (
    <svg className="text-red-400" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  );
}

const ACCEPTED_TYPES = ["application/pdf", "image/png", "image/jpeg", "image/webp"];
const ACCEPTED_EXTENSIONS = ".pdf,.png,.jpg,.jpeg,.webp";
const MAX_SIZE = 10 * 1024 * 1024;

type UploadStatus = "idle" | "uploading" | "parsing" | "done" | "error";

export function ResumeUploader() {
  const { setResumeData, setError, setJsonInput } = useAppStore();

  const [status, setStatus] = useState<UploadStatus>("idle");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [isDragOver, setIsDragOver] = useState(false);
  const [fileName, setFileName] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);
  const lastFileRef = useRef<File | null>(null);
  const dragCounter = useRef(0);

  const validateFile = useCallback((file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return "不支持的文件格式，请上传 PDF、PNG、JPG 或 WebP 文件";
    }
    if (file.size > MAX_SIZE) {
      return "文件大小超过 10MB 限制";
    }
    return null;
  }, []);

  const uploadAndParse = useCallback(
    async (file: File) => {
      const validationError = validateFile(file);
      if (validationError) {
        setStatus("error");
        setErrorMsg(validationError);
        setError(validationError);
        return;
      }

      lastFileRef.current = file;
      setFileName(file.name);
      setError(null);
      setStatus("uploading");

      try {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/parse-resume", {
          method: "POST",
          body: formData,
        });

        setStatus("parsing");

        const data = await res.json();

        if (data.success && data.data) {
          const resume = data.data as Resume;
          setResumeData(resume);
          setJsonInput(JSON.stringify(resume, null, 2));
          setStatus("done");
          setError(null);
        } else {
          const msg = data.error || "简历解析失败，请重试";
          setStatus("error");
          setErrorMsg(msg);
          setError(msg);
        }
      } catch {
        const msg = "网络错误，请检查连接后重试";
        setStatus("error");
        setErrorMsg(msg);
        setError(msg);
      }
    },
    [validateFile, setResumeData, setError, setJsonInput],
  );

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;
      uploadAndParse(files[0]);
    },
    [uploadAndParse],
  );

  const onInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleFiles(e.target.files);
      e.target.value = "";
    },
    [handleFiles],
  );

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const onDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current += 1;
    setIsDragOver(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current -= 1;
    if (dragCounter.current === 0) {
      setIsDragOver(false);
    }
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounter.current = 0;
      setIsDragOver(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles],
  );

  const openFilePicker = useCallback(() => {
    if (status === "uploading" || status === "parsing") return;
    inputRef.current?.click();
  }, [status]);

  const handleRetry = useCallback(() => {
    setStatus("idle");
    setErrorMsg("");
    setError(null);
    if (lastFileRef.current) {
      uploadAndParse(lastFileRef.current);
    } else {
      openFilePicker();
    }
  }, [uploadAndParse, openFilePicker, setError]);

  const handleClear = useCallback(() => {
    setStatus("idle");
    setErrorMsg("");
    setFileName("");
    setError(null);
    lastFileRef.current = null;
  }, [setError]);

  const isProcessing = status === "uploading" || status === "parsing";

  function getDropZoneClass(): string {
    const base = "relative flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-8 transition-colors cursor-pointer";
    if (isProcessing) {
      return base + " cursor-not-allowed border-gray-200 bg-gray-50";
    }
    if (status === "done") {
      return base + " border-green-300 bg-green-50";
    }
    if (status === "error") {
      return base + " border-red-300 bg-red-50";
    }
    if (isDragOver) {
      return base + " border-indigo-400 bg-indigo-50";
    }
    return base + " border-gray-300 bg-gray-50 hover:border-indigo-300 hover:bg-indigo-50/50";
  }

  function renderContent(): React.ReactNode {
    if (status === "idle" && !isDragOver) {
      return (
        <React.Fragment>
          <UploadIcon className="text-gray-400" />
          <span className="text-xs text-gray-500 text-center">拖拽 PDF 或图片到此处，或点击上传</span>
        </React.Fragment>
      );
    }

    if (status === "idle" && isDragOver) {
      return (
        <React.Fragment>
          <UploadIcon className="text-indigo-500" />
          <span className="text-xs text-indigo-600 font-medium text-center">释放文件以上传</span>
        </React.Fragment>
      );
    }

    if (status === "uploading") {
      return (
        <React.Fragment>
          <span className="text-indigo-500"><Spinner /></span>
          <span className="text-xs text-gray-500">正在上传 {fileName}...</span>
        </React.Fragment>
      );
    }

    if (status === "parsing") {
      return (
        <React.Fragment>
          <span className="text-indigo-500"><Spinner /></span>
          <span className="text-xs text-gray-500">正在解析 {fileName}...</span>
        </React.Fragment>
      );
    }

    if (status === "done") {
      return (
        <React.Fragment>
          <CheckIcon />
          <span className="text-xs text-green-700 font-medium text-center">
            {fileName} 解析成功
          </span>
          <button
            onClick={(e) => { e.stopPropagation(); handleClear(); }}
            className="mt-1 px-3 py-1 bg-green-600 text-white text-[11px] rounded-md hover:bg-green-700 transition"
          >
            上传新简历
          </button>
        </React.Fragment>
      );
    }

    if (status === "error") {
      return (
        <React.Fragment>
          <ErrorIcon />
          <span className="text-xs text-red-600 text-center max-w-[200px]">{errorMsg}</span>
          <button
            onClick={(e) => { e.stopPropagation(); handleRetry(); }}
            className="mt-1 px-3 py-1 bg-red-500 text-white text-[11px] rounded-md hover:bg-red-600 transition"
          >
            重试
          </button>
        </React.Fragment>
      );
    }

    return null;
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="p-4">
        <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">
          上传简历
        </label>

        <div
          role="button"
          tabIndex={isProcessing ? -1 : 0}
          onClick={openFilePicker}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") openFilePicker(); }}
          onDragOver={onDragOver}
          onDragEnter={onDragEnter}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          className={getDropZoneClass()}
        >
          <input ref={inputRef} type="file" accept={ACCEPTED_EXTENSIONS} onChange={onInputChange} className="hidden" />
          {renderContent()}
        </div>

        {status === "idle" && (
          <p className="mt-2 text-center text-[11px] text-gray-400">
            支持 PDF、PNG、JPG、WebP，最大 10MB
          </p>
        )}
      </div>
    </div>
  );
}
