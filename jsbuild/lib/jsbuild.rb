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
          Module.new.parse(fin, fout)
        else
          fout << l
        end
      end
    end
  end

  class Module
    attr_reader :path

    def initialize(path = "")
      @path = path
    end

    def parse(input, output)
      input.each_line do |l|
        if (l.include?('});'))
          return
        elsif (m = l.match(/require\(['"](.*)['"]\)/))
          copy_file(m[1], output)
        end
      end
      raise "unterminated module" if input.eof
    end

    def copy_file(file, output)
      File.open(File.join(@path, file), 'r') { |input| copy_stream(input, output) }
    end

    def copy_stream(input, output)
      output << input.read
    end
  end

  class Dependency
    attr_reader :path
    attr_reader :local_path

    def initialize(path)
      @path = path
      @local_path = File.join(FileUtils.pwd, path)
    end
  end
end