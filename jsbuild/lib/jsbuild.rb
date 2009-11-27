module JS
  class Build
    def self.build(input, output)
      File.open(output, 'w') do |fout|
        File.open(input, 'r') do |fin|
          process(fin, fout)
        end
      end
    end

    def self.process(fin, fout)
      fin.each_line do |l|
        if (l.match(/new CGD.Module/))
          Module.new(fin, fout)
        else
          fout << l
        end
      end
    end
  end

  class Module
    def initialize(input, output)
      input.each_line do |l|
        if (l.include?('});'))
          return
        elsif (m = l.match(/require\(['"](.*)['"]\)/))
          copy_file(m[0], output)
        end
      end
      raise "unterminated module" if input.eof
    end

    def copy_file(file, output)
      File.open(file, 'r') { |input| copy_stream(input, output) }
    end

    def copy_stream(input, output)
      output << input.read
    end
  end
end