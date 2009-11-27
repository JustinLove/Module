module JS
  class Build
    def self.build(input, output)
      File.open(output, 'w') do |fout|
        File.open(input, 'r') do |fin|
          l = fin.readline
          if (l.match(/new CGD.Module/))
            Module.new(fin, fout)
          else
            fout << l
          end
        end
      end
    end
  end
  
  class Module
    def initialize(input, output)
      input.each_line do |l|
        if (l.include?('});'))
          return
        end
      end
      raise "unterminated module" if input.eof
    end
  end
end