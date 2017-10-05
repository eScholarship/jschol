##################################################################################################
# Thread synchronization class
class Event
  def initialize
    @lock = Mutex.new
    @cond = ConditionVariable.new
    @flag = false
  end
  def set
    @lock.synchronize do
      @flag = true
      @cond.broadcast
   end
  end
  def wait
    @lock.synchronize do
      if not @flag
        @cond.wait(@lock)
      end
    end
  end
end

