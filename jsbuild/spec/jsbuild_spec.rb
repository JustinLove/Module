require File.join(File.dirname(__FILE__), 'spec_helper')
libs %w{jsbuild}

describe JS::Build do
  it "passes simple files through unaffected" do
    def file_contents(file)
      File.open(file) {|f| f.readlines.join('\n')}
    end

    def compare_files(input, output)
      file_contents(input).should == file_contents(output)
    end

    JS::Build.build(file('spec/input/simple.js'), file('spec/output/simple-built.js'))
    compare_files(file('spec/input/simple.js'), file('spec/output/simple-built.js'))
  end
end