import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import WorkoutTimer, { TimerExercise } from './WorkoutTimer';

interface TimerPopupProps {
  exercise: TimerExercise;
  dayName: string;
  exerciseIndex: number;
  onComplete: (exerciseIndex: number, weight: number) => void;
  onWeightChange: (exerciseIndex: number, newWeight: number) => void;
  onClose: () => void;
}

interface PopupWindowManager {
  openPopup: (props: TimerPopupProps) => void;
  closePopup: () => void;
  isOpen: boolean;
}

// Global popup window manager
class TimerPopupManager {
  private popupWindow: Window | null = null;
  private popupRoot: any = null;
  private currentProps: TimerPopupProps | null = null;

  openPopup(props: TimerPopupProps) {
    // Close existing popup if open
    this.closePopup();

    // Calculate popup position (center of screen)
    const width = 400;
    const height = 700;
    const left = Math.max(0, (window.screen.width - width) / 2);
    const top = Math.max(0, (window.screen.height - height) / 2);

    // Open new popup window
    this.popupWindow = window.open(
      '',
      'workout-timer',
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=no,status=no,menubar=no,toolbar=no,location=no`
    );

    if (!this.popupWindow) {
      // Fallback: show modal in main window
      this.showModalFallback(props);
      return;
    }

    // Set up popup window
    this.setupPopupWindow(props);
    this.currentProps = props;

    // Handle popup close event
    this.popupWindow.addEventListener('beforeunload', () => {
      this.cleanup();
      props.onClose();
    });

    // Keep popup on top (focus every 5 seconds)
    const keepOnTop = setInterval(() => {
      if (this.popupWindow && !this.popupWindow.closed) {
        this.popupWindow.focus();
      } else {
        clearInterval(keepOnTop);
      }
    }, 5000);
  }

  private setupPopupWindow(props: TimerPopupProps) {
    if (!this.popupWindow) return;

    // Set up HTML structure
    this.popupWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Workout Timer - ${props.exercise.name}</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background: #f8fafc;
              overflow: hidden;
            }
            #timer-root {
              height: 100vh;
              display: flex;
              align-items: flex-start;
              justify-content: center;
              padding: 0;
            }
          </style>
          <script src="https://cdn.tailwindcss.com"></script>
        </head>
        <body>
          <div id="timer-root"></div>
        </body>
      </html>
    `);

    this.popupWindow.document.close();

    // Wait for document to be ready
    setTimeout(() => {
      const container = this.popupWindow!.document.getElementById('timer-root');
      if (container) {
        this.popupRoot = createRoot(container);
        this.renderTimer(props);
      }
    }, 100);
  }

  private renderTimer(props: TimerPopupProps) {
    if (!this.popupRoot) return;

    this.popupRoot.render(
      React.createElement(WorkoutTimer, {
        ...props,
        isPopup: true,
        onClose: () => {
          this.closePopup();
          props.onClose();
        },
        onComplete: (exerciseIndex: number, weight: number) => {
          props.onComplete(exerciseIndex, weight);
          // Keep popup open after completion for user to manually close
        },
        onWeightChange: (exerciseIndex: number, newWeight: number) => {
          props.onWeightChange(exerciseIndex, newWeight);
        }
      })
    );
  }

  private showModalFallback(props: TimerPopupProps) {
    // Create modal overlay in main window as fallback
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.8);
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    `;

    const container = document.createElement('div');
    container.id = 'timer-modal-root';
    overlay.appendChild(container);
    document.body.appendChild(overlay);

    // Render timer in modal
    const modalRoot = createRoot(container);
    modalRoot.render(
      React.createElement(WorkoutTimer, {
        ...props,
        isPopup: true,
        onClose: () => {
          modalRoot.unmount();
          document.body.removeChild(overlay);
          props.onClose();
        }
      })
    );

    // Store reference for cleanup
    this.popupRoot = {
      unmount: () => {
        modalRoot.unmount();
        if (document.body.contains(overlay)) {
          document.body.removeChild(overlay);
        }
      }
    };
  }

  closePopup() {
    if (this.popupWindow && !this.popupWindow.closed) {
      this.popupWindow.close();
    }
    this.cleanup();
  }

  private cleanup() {
    if (this.popupRoot) {
      try {
        this.popupRoot.unmount();
      } catch (error) {
        console.warn('Error unmounting popup root:', error);
      }
      this.popupRoot = null;
    }
    this.popupWindow = null;
    this.currentProps = null;
  }

  get isOpen(): boolean {
    return this.popupWindow !== null && !this.popupWindow.closed;
  }

  updateProps(newProps: Partial<TimerPopupProps>) {
    if (this.currentProps && this.popupRoot) {
      this.currentProps = { ...this.currentProps, ...newProps };
      this.renderTimer(this.currentProps);
    }
  }
}

// Global singleton instance
const timerPopupManager = new TimerPopupManager();

// Hook for using the timer popup
export const useTimerPopup = (): PopupWindowManager => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Check if popup is open on mount
    setIsOpen(timerPopupManager.isOpen);

    // Set up interval to check popup status
    const checkInterval = setInterval(() => {
      setIsOpen(timerPopupManager.isOpen);
    }, 1000);

    return () => clearInterval(checkInterval);
  }, []);

  return {
    openPopup: (props: TimerPopupProps) => {
      const wrappedProps = {
        ...props,
        onClose: () => {
          setIsOpen(false);
          props.onClose();
        }
      };
      timerPopupManager.openPopup(wrappedProps);
      setIsOpen(true);
    },
    closePopup: () => {
      timerPopupManager.closePopup();
      setIsOpen(false);
    },
    isOpen
  };
};

// React component version for inline modal
const TimerPopup: React.FC<TimerPopupProps> = (props) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <WorkoutTimer {...props} isPopup={false} />
      </div>
    </div>
  );
};

export default TimerPopup;
export { timerPopupManager };