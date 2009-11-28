require 'fileutils'

module JS
  class Module
    attr_reader :path

    def self.clear_files
      @@files = {}
    end
    clear_files

    def initialize(path = "")
      @path = path
    end

    def parse(input, output)
      input.each_line do |l|
        if (l.include?('});'))
          return
        elsif (m = l.match(/require\(['"](.*)['"]\)/))
          require_file(m[1], output)
        elsif (ma = l.match(/under\(['"]([^"']*)["']/))
          Module.new(File.join(path, ma[1])).parse(input, output)
        end
      end
      raise "unterminated module" if input.eof
    end

    def require_file(file, output)
      if (@@files[file])
        return @@files[file]
      end
      fullpath = File.join(@path, file)
      if (@@files[fullpath])
        return @@files[fullpath]
      end
      @@files[file] = @@files[fullpath] = Dependency.new(fullpath).process(output)
    end
  end

  class Dependency
    attr_reader :path
    attr_reader :local_path

    def initialize(path)
      @path = path
      @local_path = File.join(FileUtils.pwd, path)
    end

    def build(output)
      File.open(output, 'w') do |fout|
        process(fout)
      end
    end

    def process(fout)
      File.open(path, 'r') {|fin| parse(fin, fout) }
    end

    def parse(fin, fout)
      fin.each_line do |l|
        if (ma = l.match(/new CGD.Module\(['"]([^"']*)["']/))
          Module.new(path.gsub(ma[1], '')).parse(fin, fout)
        else
          fout << l
        end
      end
    end
  end
end

if __FILE__ == $0
  if (ARGV.length == 2)
    JS::Dependency.new(ARGV[0]).build(ARGV[1])
  else
    puts "usage: ruby jsbuild.rb <top>.js <ouput>.js"
  end
end