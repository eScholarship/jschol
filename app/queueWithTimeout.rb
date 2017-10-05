# Adapted from https://spin.atomicobject.com/2014/07/07/ruby-queue-pop-timeout/

# MH: Why does Ruby's Queue class not support a timeout? That's just dumb.

class QueueWithTimeout
  def initialize
    @mutex = Mutex.new
    @queue = []
    @received = ConditionVariable.new
  end
 
  def <<(x)
    push(x)
  end

  def push(x)
    @mutex.synchronize do
      @queue << x
      @received.signal
    end
  end

  def empty?
    @mutex.synchronize do
      return @queue.empty?
    end
  end
 
  def pop(non_block = false)
    pop_with_timeout(non_block ? 0 : nil)
  end
 
  def pop_with_timeout(timeout = nil)
    @mutex.synchronize do
      if @queue.empty?
        @received.wait(@mutex, timeout) if timeout != 0
        #if we're still empty after the timeout, raise exception
        raise ThreadError, "queue timeout expired" if @queue.empty?
      end
      @queue.shift
    end
  end
end
