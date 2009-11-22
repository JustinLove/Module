module JS
  class Build
    def self.build(input, output)
      FileUtils.cp(input, output)
    end
  end
end